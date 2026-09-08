<?php
// Integration checks against real WooCommerce models; only local, temporary fixtures are removed.
if (wp_get_environment_type() !== 'local' || !defined('WP_CLI')) {
    throw new RuntimeException('Tests require the local Docker environment.');
}

$created = [];
$checks = 0;
$check = static function (bool $condition, string $message) use (&$checks): void {
    if (!$condition) {
        throw new RuntimeException($message);
    }
    ++$checks;
    WP_CLI::log("PASS: {$message}");
};
$create = static function (string $mode = 'online', string $unit = 'piece') use (&$created): WC_Product_Simple {
    $product = new WC_Product_Simple();
    $product->set_name('NP integration fixture');
    $product->set_status('publish');
    $product->set_regular_price('1000');
    $product->set_manage_stock(true);
    $product->set_stock_quantity(1);
    $product->update_meta_data('_np_purchase_mode', $mode);
    $product->update_meta_data('_np_sale_unit', $unit);
    $created[] = $product->save();
    return $product;
};

try {
    wp_set_current_user(get_users(['role' => 'administrator', 'number' => 1, 'fields' => 'ID'])[0]);
    wc_load_cart();
    $online = $create();
    $contact = $create('contact');
    $fabric = $create('online', 'meter');
    $check($online->is_purchasable(), 'Stocked online product can be purchased');
    $check(!$contact->is_purchasable(), 'Priced contact product cannot be purchased');
    $contact->delete_meta_data('_np_purchase_mode');
    $contact->save();
    $check(!wc_get_product($contact->get_id())->is_purchasable(), 'Missing mode defaults to contact');
    $check(NPGroup\cart_error($fabric, 1.5) !== '', 'Fractional fabric meters rejected');
    $check(NPGroup\cart_error($fabric, 1) === '', 'One whole meter accepted');
    $check(NPGroup\cart_error($online, 2) !== '', 'Quantity cannot exceed stock');
    $check(NPGroup\cart_error($online, 0) !== '', 'Zero quantity cannot be added');

    $online->set_stock_quantity(0);
    $online->set_backorders('yes');
    $online->save();
    $check(!$online->backorders_allowed(), 'Native backorder setting cannot enable online ordering');
    $check(!$online->is_purchasable(), 'Zero-stock backorder product is not purchasable');
    $check(NPGroup\cart_error($online, 1) !== '', 'Zero-stock order rejected even with backorders configured');

    $parent = new WC_Product_Variable();
    $parent->set_name('NP variation fixture');
    $parent->set_status('publish');
    $parent->update_meta_data('_np_purchase_mode', 'contact');
    $created[] = $parent->save();
    $variation = new WC_Product_Variation();
    $variation->set_parent_id($parent->get_id());
    $variation->set_regular_price('2000');
    $variation->set_manage_stock(true);
    $variation->set_stock_quantity(1);
    $created[] = $variation->save();
    $check(!$variation->is_purchasable(), 'Variation inherits contact mode from parent');
    $parent->update_meta_data('_np_purchase_mode', 'online');
    $parent->save();
    $variation = wc_get_product($variation->get_id());
    $check($variation->is_purchasable(), 'Online variation keeps its own price and stock');
    $check($variation->get_price() === '2000', 'Variation price stays native');

    $_POST = [
        'np_product_nonce' => wp_create_nonce('np_save_product'),
        '_np_purchase_mode' => 'online', '_np_sale_unit' => 'meter', '_np_lead_time' => '۴ هفته',
        'np_specifications' => [['title' => '<b>جنس</b>', 'value' => 'چوب'], ['title' => '', 'value' => 'ignore']],
    ];
    do_action('woocommerce_admin_process_product_object', $fabric);
    $fabric->save();
    $saved = wc_get_product($fabric->get_id());
    $check($saved->get_meta('_np_specifications') === [['title' => 'جنس', 'value' => 'چوب']], 'Admin save sanitizes and persists specifications');
    $_POST['np_product_nonce'] = 'invalid';
    $_POST['_np_purchase_mode'] = 'contact';
    do_action('woocommerce_admin_process_product_object', $saved);
    $check(NPGroup\purchase_mode($saved) === 'online', 'Invalid nonce cannot change product settings');
    wp_set_current_user(0);
    $_POST['np_product_nonce'] = wp_create_nonce('np_save_product');
    do_action('woocommerce_admin_process_product_object', $saved);
    $check(NPGroup\purchase_mode($saved) === 'online', 'Anonymous user cannot change product settings');

    require __DIR__ . '/store-api.php';
    WP_CLI::success("{$checks} product integration checks passed.");
} finally {
    $_POST = [];
    if (WC()->cart) {
        WC()->cart->empty_cart();
    }
    foreach (array_reverse($created) as $id) {
        $product = wc_get_product($id);
        if ($product) {
            $product->delete(true);
        }
    }
}
