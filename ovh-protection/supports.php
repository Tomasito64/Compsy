<?php
declare(strict_types=1);
// PHP 8.2+. This file is copied into the prepared public directory only.
ini_set('display_errors', '0');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: same-origin');
header('X-Robots-Tag: noindex, nofollow');
header("Content-Security-Policy: default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'");
function stop(int $status, string $message): never { http_response_code($status); header('Content-Type: text/plain; charset=utf-8'); echo $message; exit; }
function e(string $s): string { return htmlspecialchars($s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); }
function input(string $key): string { return isset($_POST[$key]) && is_string($_POST[$key]) ? $_POST[$key] : ''; }
function jump(string $url): never { header('Location: '.$url, true, 303); exit; }
function hidden(string $name, string $value): string { return '<input type="hidden" name="'.e($name).'" value="'.e($value).'">'; }
function page(string $title, string $body): never {
 header('Content-Type: text/html; charset=utf-8');
 echo '<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'.e($title).'</title><link rel="stylesheet" href="styles.css"><body><main style="max-width:780px;margin:auto;padding:28px 18px"><div class="panel"><img src="logo-coquelicot.png" width="48" alt=""><h1>'.e($title).'</h1>'.$body.'<p style="margin-top:24px"><a href="formations.html">Retour aux formations</a></p></div></main></body></html>'; exit;
}
function button(string $text): string {return '<button class="btn primary" type="submit">'.e($text).'</button>';}
function codeField(): string {return '<label>Code de la formation (4 chiffres minimum)<input name="code" type="password" inputmode="numeric" pattern="[0-9]{4,128}" minlength="4" maxlength="128" autocomplete="off" required></label>';}

try {
 $method=$_SERVER['REQUEST_METHOD']??'GET';
 if(!in_array($method,['GET','HEAD','POST'],true)) stop(405,'Méthode refusée');
 if((int)($_SERVER['CONTENT_LENGTH']??0)>4096) stop(413,'Requête trop longue');
 $local=PHP_SAPI==='cli-server' && getenv('COMPSY_LOCAL_TEST')==='1';
 $https=($_SERVER['HTTPS']??'')==='on' || ($_SERVER['SERVER_PORT']??'')==='443';
 if(!$local && !$https) stop(403,'Une connexion HTTPS est nécessaire.');
 $private=realpath(getenv('COMPSY_PRIVATE_DIR') ?: dirname(__DIR__).'/compsy-private');
 $public=realpath(__DIR__);
 if(!$private || $private===$public || str_starts_with($private,$public.DIRECTORY_SEPARATOR)) stop(503,'Accès aux supports en cours de configuration.');
 $config=json_decode(file_get_contents($private.'/config.json'),true,512,JSON_THROW_ON_ERROR);
 $catalog=json_decode(file_get_contents($private.'/catalog.json'),true,512,JSON_THROW_ON_ERROR);
 if(empty($config['admin_hash'])) stop(503,'Administration en cours de configuration.');
 // Durable state lives outside the mirrored public folder. Lock writers separately
 // from the data file so replacing that file is atomic for readers and writers.
 function stateChange(callable $fn): mixed {
  global $private;
  $lock=fopen($private.'/state.lock','c'); if(!$lock||!flock($lock,LOCK_EX)) throw new RuntimeException('state lock');
  try {
   $file=$private.'/state.json';
   $state=is_file($file)?json_decode(file_get_contents($file),true,512,JSON_THROW_ON_ERROR):['codes'=>[],'attempts'=>[]];
   $result=$fn($state);
   $tmp=tempnam($private,'state-');
   try { if(file_put_contents($tmp,json_encode($state,JSON_THROW_ON_ERROR))===false)throw new RuntimeException('state write'); chmod($tmp,0600);if(!rename($tmp,$file))throw new RuntimeException('state rename'); }
   finally {if(is_file($tmp))unlink($tmp);}
   return $result;
  } finally {flock($lock,LOCK_UN);fclose($lock);}
 }
 function currentCodes(): array {global $private; $file=$private.'/state.json';return is_file($file)?json_decode(file_get_contents($file),true,512,JSON_THROW_ON_ERROR)['codes']:[];}
 function allowedCode(string $value,string $group): string {
  return stateChange(function(array &$s)use($value,$group){return verifyAttempt($s,$group,$value,$s['codes'][$group]['hash']??'') ? $s['codes'][$group]['version'] : '';});
 }
 function verifyAttempt(array &$s,string $key,string $value,string $hash): bool {
  $now=time();foreach($s['attempts'] as $k=>$v)if($v['until']<=$now)unset($s['attempts'][$k]);
  $attempt=$s['attempts'][$key]??['count'=>0,'until'=>$now+300];
  if($attempt['count']>=10)return false;
  if($hash!=='' && password_verify(hash('sha256',$value),$hash)){unset($s['attempts'][$key]);return true;}
  $attempt['count']++;$s['attempts'][$key]=$attempt;return false;
 }
 if(!is_dir($private.'/sessions')&&!mkdir($private.'/sessions',0700))throw new RuntimeException('sessions');
 ini_set('session.use_strict_mode','1');ini_set('session.use_only_cookies','1');
 session_save_path($private.'/sessions');session_name('compsy_access');
 session_set_cookie_params(['lifetime'=>0,'path'=>'/','secure'=>!$local,'httponly'=>true,'samesite'=>'Strict']);
 session_start();
 if(($_SESSION['expires']??0)<time()){$_SESSION=[];session_regenerate_id(true);}
 $_SESSION['expires']??=time()+3600;$_SESSION['csrf']??=bin2hex(random_bytes(24));
 $csrf=hidden('csrf',$_SESSION['csrf']);
 if($method==='POST'&&!hash_equals($_SESSION['csrf'],input('csrf'))) stop(403,'Session expirée. Rechargez la page et réessayez.');
 $action=isset($_GET['action'])&&is_string($_GET['action'])?$_GET['action']:'';
 if($action==='admin') {
  if(empty($_SESSION['admin'])) {
   $error='';
   if($method==='POST') {
    $ok=stateChange(function(array &$s)use($config){return verifyAttempt($s,'admin',input('password'),$config['admin_hash']);});
    if($ok){session_regenerate_id(true);$_SESSION['admin']=true;jump('supports.php?action=admin');}
    http_response_code(401);$error='<p role="alert">Mot de passe incorrect ou trop de tentatives. Après dix échecs, attendez cinq minutes.</p>';
   }
   page('Administration des formations',$error.'<form class="contact-form" method="post">'.$csrf.'<label>Mot de passe administrateur<input name="password" type="password" autocomplete="current-password" maxlength="128" required></label>'.button('Se connecter').'</form>');
  }
  if($method==='POST') {
   if(input('operation')==='logout'){$_SESSION=[];session_destroy();jump('supports.php?action=admin');}
   $id=input('formation');$code=input('code');
   if(!isset($catalog['formations'][$id])||!preg_match('/\A[0-9]{4,128}\z/',$code))stop(400,'Choisissez un code de 4 à 128 chiffres.');
   $hash=password_hash(hash('sha256',$code),PASSWORD_DEFAULT);
   stateChange(function(array &$s)use($id,$hash){$s['codes'][$id]=['hash'=>$hash,'version'=>bin2hex(random_bytes(16))];unset($s['attempts'][$id]);});
   jump('supports.php?action=admin&saved=1');
  }
  $codes=currentCodes();
  $body='<p>Choisissez un code par formation et transmettez-le aux participants. Un nouveau code remplace immédiatement l’ancien.</p>';
  if(isset($_GET['saved']))$body.='<p role="status">Code enregistré.</p>';
  foreach($catalog['formations'] as $id=>$course){$body.='<section style="padding:20px 0;border-bottom:1px solid #ddd"><h2>'.e($course['title']).'</h2><p>'.count($course['documents']).' document(s) · '.(isset($codes[$id])?'Code défini':'Aucun code : téléchargement fermé').'</p><form class="contact-form" method="post">'.$csrf.hidden('formation',$id).codeField().button('Enregistrer le code').'</form></section>';}
  $body.='<form method="post" style="margin-top:24px">'.$csrf.hidden('operation','logout').button('Se déconnecter').'</form>';
  page('Codes des formations',$body);
 }
 $docId=isset($_GET['document'])&&is_string($_GET['document'])?$_GET['document']:'';
 $doc=$catalog['documents'][$docId]??null;if(!$doc)stop(404,'Document introuvable');
 $course=$catalog['formations'][$doc['formation']];$id=$doc['formation'];$codes=currentCodes();
 $grant=$_SESSION['grants'][$id]??'';
 if(!isset($codes[$id]) || !hash_equals($codes[$id]['version'],$grant)) {
  $error='';
  if($method==='POST'){
   if(($version=allowedCode(input('code'),$id))!==''){
    session_regenerate_id(true);$_SESSION['grants'][$id]=$version;jump('supports.php?document='.rawurlencode($docId));
   }
   http_response_code(401);$error='<p role="alert">Code incorrect ou trop de tentatives. Après dix échecs, attendez cinq minutes.</p>';
  }
  page('Accès aux supports','<h2>'.e($course['title']).'</h2><p>La présentation est publique. Saisissez le code transmis par votre formateur pour télécharger ce document.</p>'.$error.(isset($codes[$id])?'<form class="contact-form" method="post">'.$csrf.codeField().button('Télécharger le document').'</form>':'<p>Le code de cette formation n’a pas encore été défini. Contactez votre formateur.</p>'));
 }
 // Only catalogued content hashes can be served; no user-provided filesystem path.
 if(!preg_match('/\A[a-f0-9]{64}\.pdf\z/',$doc['storage']))throw new RuntimeException('catalog');
 $file=$private.'/documents/'.$doc['storage'];if(!is_file($file))stop(404,'Document indisponible');
 session_write_close();
 header('Content-Type: application/pdf');header("Content-Disposition: attachment; filename*=UTF-8''".rawurlencode($doc['name']));header('Content-Length: '.filesize($file));
 if($method!=='HEAD')readfile($file);
} catch(Throwable $exception) { error_log('Compsy supports: '.get_class($exception)); stop(503,'Accès temporairement indisponible. Réessayez ultérieurement.'); }
