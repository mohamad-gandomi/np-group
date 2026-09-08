<?php
namespace NPGroup;

defined('ABSPATH') || exit;

function register_product_fields(): void
{
    add_filter('woocommerce_product_data_tabs', static function (array $tabs): array {
        $tabs['np_group'] = ['label' => 'تنظیمات ان‌پی', 'target' => 'np-product-panel', 'priority' => 65];
        return $tabs;
    });
    add_action('woocommerce_product_data_panels', __NAMESPACE__ . '\\render_product_fields');
    add_action('woocommerce_admin_process_product_object', __NAMESPACE__ . '\\save_product_fields');
    add_action('admin_enqueue_scripts', static function () {
        if (get_current_screen()?->id !== 'product') {
            return;
        }
        $path = dirname(__DIR__, 2) . '/assets/product-fields.js';
        wp_enqueue_script('np-product-fields', plugins_url('assets/product-fields.js', dirname(__DIR__, 2) . '/np-group.php'), [], (string) filemtime($path), true);
    });
}

function render_product_fields(): void
{
    global $product_object;
    if (!$product_object instanceof \WC_Product) {
        return;
    }
    $product = $product_object;
    $rows = sanitize_specifications($product->get_meta('_np_specifications'));
    require __DIR__ . '/views/product-panel.php';
}

function save_product_fields(\WC_Product $product): void
{
    $nonce = $_POST['np_product_nonce'] ?? '';
    if (!is_string($nonce) || !wp_verify_nonce(wp_unslash($nonce), 'np_save_product') || !current_user_can('edit_post', $product->get_id())) {
        return;
    }
    $mode = $_POST['_np_purchase_mode'] ?? 'contact';
    $unit = $_POST['_np_sale_unit'] ?? 'piece';
    $lead_time = $_POST['_np_lead_time'] ?? '';
    $product->update_meta_data('_np_purchase_mode', $mode === 'online' ? 'online' : 'contact');
    $product->update_meta_data('_np_sale_unit', $unit === 'meter' ? 'meter' : 'piece');
    $product->update_meta_data('_np_lead_time', is_string($lead_time) ? sanitize_text_field(wp_unslash($lead_time)) : '');
    $product->update_meta_data('_np_specifications', sanitize_specifications(wp_unslash($_POST['np_specifications'] ?? [])));
}
