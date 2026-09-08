<?php
namespace NPGroup;

defined('ABSPATH') || exit;

/** The Store API is the customer-facing API used by a headless storefront. */
function register_store_api_rules(): void
{
    add_filter('rest_pre_dispatch', __NAMESPACE__ . '\\validate_raw_store_quantity', 10, 3);
    add_action('woocommerce_store_api_validate_add_to_cart', __NAMESPACE__ . '\\validate_store_api_item', 20, 2);
    add_action('woocommerce_store_api_validate_cart_item', __NAMESPACE__ . '\\validate_store_api_item', 20, 2);
    add_filter('woocommerce_store_api_product_quantity_multiple_of', static fn () => 1, 20);
    add_filter('woocommerce_store_api_product_quantity_minimum', static fn () => 1, 20);
}

/** Reject fractions before WooCommerce's stock sanitizer rounds the request. */
function validate_raw_store_quantity(mixed $result, \WP_REST_Server $server, \WP_REST_Request $request): mixed
{
    if ($result !== null || $request->get_method() !== 'POST'
        || !preg_match('#^/wc/store/v1/cart/(add-item|update-item)/?$#', $request->get_route())) {
        return $result;
    }
    $quantity = $request->get_param('quantity');
    if ($quantity !== null && !valid_quantity($quantity)) {
        return new \WP_Error('np_invalid_quantity', 'تعداد یا متراژ باید عدد صحیح و حداقل یک باشد.', ['status' => 400]);
    }
    return $result;
}

function validate_store_api_item(\WC_Product $product, array $item): void
{
    $error = cart_error($product, $item['quantity'] ?? 1);
    if ($error !== '') {
        throw new \Automattic\WooCommerce\StoreApi\Exceptions\RouteException('np_invalid_purchase', $error, 400);
    }
}
