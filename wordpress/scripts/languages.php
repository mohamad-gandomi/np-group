<?php
// Offline extraction of official language packs downloaded by the host.
if (wp_get_environment_type() !== 'local') {
    WP_CLI::error('This installer is for the local Docker environment only.');
}
require_once ABSPATH . 'wp-admin/includes/file.php';
WP_Filesystem();
$version = getenv('WOOCOMMERCE_VERSION');
$archives = [
    '/workspace/packages/wordpress-7.1-fa_IR.zip' => WP_LANG_DIR,
    "/workspace/packages/woocommerce-{$version}-fa_IR.zip" => WP_LANG_DIR . '/plugins',
];
foreach ($archives as $archive => $destination) {
    wp_mkdir_p($destination);
    $result = unzip_file($archive, $destination);
    if (is_wp_error($result)) {
        WP_CLI::error($result->get_error_message());
    }
}
WP_CLI::success('Persian language packs installed.');
