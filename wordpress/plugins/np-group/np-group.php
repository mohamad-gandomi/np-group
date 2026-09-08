<?php
/**
 * Plugin Name: گروه ان‌پی
 * Description: تنظیمات محصولات و ارتباط فروشگاه ان‌پی با ووکامرس.
 * Version: 0.1.0
 * Requires at least: 7.0
 * Requires PHP: 8.3
 * Requires Plugins: woocommerce
 * Text Domain: np-group
 */

namespace NPGroup;

defined('ABSPATH') || exit;

add_action('before_woocommerce_init', static function () {
    if (class_exists(\Automattic\WooCommerce\Utilities\FeaturesUtil::class)) {
        \Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility('custom_order_tables', __FILE__, true);
    }
});

add_action('plugins_loaded', static function () {
    if (!class_exists('WooCommerce')) {
        add_action('admin_notices', static function () {
            echo '<div class="notice notice-error"><p>افزونه ان‌پی به ووکامرس نیاز دارد.</p></div>';
        });
        return;
    }

    require_once __DIR__ . '/includes/product-data.php';
    require_once __DIR__ . '/includes/purchase-rules.php';
    require_once __DIR__ . '/includes/store-api-rules.php';
    require_once __DIR__ . '/includes/admin/settings.php';
    require_once __DIR__ . '/includes/admin/product-fields.php';

    register_purchase_rules();
    register_store_api_rules();
    register_settings_page();
    register_product_fields();
});
