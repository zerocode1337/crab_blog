GIF89a
<?php
echo md5("webscan");
$file = basename(__FILE__);
if(file_exists($file)) {
 @unlink ($file);
}
?>
