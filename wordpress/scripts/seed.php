<?php
if (wp_get_environment_type() !== 'local' || !defined('WP_CLI') || !class_exists('WooCommerce')) {
    throw new RuntimeException('Local WooCommerce is required.');
}

$samples = [
    ['NP-LOCAL-ACCESSORY', 'اکسسوری آزمایشی — خرید آنلاین', 'online', 'piece', 1, '2500000'],
    ['NP-LOCAL-FABRIC', 'پارچه آزمایشی — قیمت هر متر', 'online', 'meter', 20, '1500000'],
    ['NP-LOCAL-SET', 'ست مبلمان آزمایشی — سفارش تلفنی', 'contact', 'piece', 1, '900000000'],
    ['NP-LOCAL-CONTACT', 'محصول آزمایشی — تماس برای قیمت', 'contact', 'piece', 0, ''],
];

foreach ($samples as [$sku, $name, $mode, $unit, $stock, $price]) {
    if (wc_get_product_id_by_sku($sku)) {
        WP_CLI::log("Already exists: {$sku}");
        continue;
    }
    $product = new WC_Product_Simple();
    $product->set_name($name);
    $product->set_sku($sku);
    $product->set_status('publish');
    $product->set_description('صرفاً داده آزمایشی برای بررسی افزونه؛ محصول واقعی فروشگاه نیست.');
    $product->set_regular_price($price);
    $product->set_manage_stock(true);
    $product->set_stock_quantity($stock);
    $product->set_backorders('no');
    $product->update_meta_data('_np_purchase_mode', $mode);
    $product->update_meta_data('_np_sale_unit', $unit);
    $product->update_meta_data('_np_specifications', [['title' => 'نوع داده', 'value' => 'آزمایشی']]);
    $id = $product->save();
    wp_set_object_terms($id, ['نشیمن'], 'product_tag');
    WP_CLI::log("Created {$sku}: {$id}");
}
WP_CLI::success('Sample products ready. No manufacturer data imported.');
