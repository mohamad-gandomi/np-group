<?php
// Runs before loading WordPress so a plugin parse error is reported directly.
$directories = ['/var/www/html/wp-content/plugins/np-group', '/workspace/scripts', '/workspace/tests'];
foreach ($directories as $directory) {
    $files = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($directory, FilesystemIterator::SKIP_DOTS));
    foreach ($files as $file) {
        if ($file->getExtension() !== 'php') {
            continue;
        }
        passthru(escapeshellarg(PHP_BINARY) . ' -l ' . escapeshellarg($file->getPathname()), $status);
        if ($status !== 0) {
            exit($status);
        }
    }
}
