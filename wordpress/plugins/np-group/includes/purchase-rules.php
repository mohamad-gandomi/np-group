<?php
namespace NPGroup;

defined('ABSPATH') || exit;

function register_purchase_rules(): void
{
    add_filter('woocommerce_is_purchasable', __NAMESPACE__ . '\\is_purchasable', 20, 2);
    add_filter('woocommerce_variation_is_purchasable', __NAMESPACE__ . '\\is_purchasable', 20, 2);
    add_filter('woocommerce_product_backorders_allowed', '__return_false', 20);
    add_filter('woocommerce_add_to_cart_validation', __NAMESPACE__ . '\\validate_cart_addition', 20, 5);
    add_filter('woocommerce_update_cart_validation', __NAMESPACE__ . '\\validate_cart_update', 20, 4);
    add_action('woocommerce_check_cart_items', __NAMESPACE__ . '\\validate_existing_cart');
    add_filter('woocommerce_quantity_input_args', static function ($args) {
        $args['step'] = 1;
        $args['min_value'] = max(1, $args['min_value']);
        return $args;
    });
}

function is_purchasable(bool $purchasable, \WC_Product $product): bool
{
    return $purchasable && purchase_mode($product) === 'online'
        && $product->is_in_stock() && $product->has_enough_stock(1);
}

function valid_quantity(mixed $quantity): bool
{
    return is_numeric($quantity) && is_finite((float) $quantity)
        && (float) $quantity >= 1 && floor((float) $quantity) === (float) $quantity;
}

function cart_error(\WC_Product $product, mixed $quantity): string
{
    if (purchase_mode($product) !== 'online') {
        return 'برای سفارش این محصول با فروشگاه تماس بگیرید.';
    }
    if (!valid_quantity($quantity)) {
        return sale_unit($product) === 'meter' ? 'متراژ باید عدد صحیح و حداقل یک متر باشد.' : 'تعداد باید عدد صحیح و حداقل یک باشد.';
    }
    if (!$product->is_in_stock() || !$product->has_enough_stock($quantity)) {
        return 'موجودی این محصول کافی نیست. برای سفارش جدید با فروشگاه تماس بگیرید.';
    }
    return '';
}

function validate_cart_addition(bool $passed, int $product_id, mixed $quantity, int $variation_id = 0, array $variations = []): bool
{
    $product = wc_get_product($variation_id ?: $product_id);
    return $product ? validate_product_quantity($passed, $product, $quantity) : false;
}

function validate_cart_update(bool $passed, string $key, array $item, mixed $quantity): bool
{
    // Zero removes a cart line and must remain possible.
    return (float) $quantity === 0 ? $passed : validate_product_quantity($passed, $item['data'], $quantity);
}

function validate_product_quantity(bool $passed, \WC_Product $product, mixed $quantity): bool
{
    $error = cart_error($product, $quantity);
    if ($error !== '') {
        wc_add_notice($error, 'error');
        return false;
    }
    return $passed;
}

function validate_existing_cart(): void
{
    if (!WC()->cart) {
        return;
    }
    foreach (WC()->cart->get_cart() as $item) {
        validate_product_quantity(true, $item['data'], $item['quantity']);
    }
}
