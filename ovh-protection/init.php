<?php
declare(strict_types=1);
// One-time local preparation; never uploaded into the public site.
if(PHP_SAPI!=='cli')exit(1);
$dir=$argv[1]??'';
$password=getenv('COMPSY_ADMIN_PASSWORD')?:'';
if(!is_dir($dir)||strlen($password)<16){fwrite(STDERR,"Set COMPSY_ADMIN_PASSWORD (16+ characters) and pass the private directory.\n");exit(1);}
$file=$dir.'/config.json';
if(file_exists($file)){fwrite(STDERR,"Configuration already exists; refusing to overwrite.\n");exit(1);}
file_put_contents($file,json_encode(['admin_hash'=>password_hash(hash('sha256',$password),PASSWORD_DEFAULT)],JSON_THROW_ON_ERROR));chmod($file,0600);
echo "Private configuration prepared. No password printed.\n";
