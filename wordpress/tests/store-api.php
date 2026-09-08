<?php
// Run by products.php with the same temporary fixtures and cleanup boundary.
$controller = new Automattic\WooCommerce\StoreApi\Utilities\CartController();
WC()->cart->empty_cart();
wc_clear_notices();
$rejected = false;
try {
    $controller->add_to_cart(['id' => $contact->get_id(), 'quantity' => 1]);
} catch (Exception $error) {
    $rejected = true;
}
$check($rejected && WC()->cart->is_empty(), 'Store API rejects contact products');
wc_clear_notices();
$rejected = false;
try {
    $controller->add_to_cart(['id' => $fabric->get_id(), 'quantity' => 1.5]);
} catch (Exception $error) {
    $rejected = true;
}
$check($rejected && WC()->cart->is_empty(), 'Store API rejects fractional meters');
wc_clear_notices();
$key = $controller->add_to_cart(['id' => $fabric->get_id(), 'quantity' => 1]);
$check((bool) $key && WC()->cart->get_cart_contents_count() === 1, 'Store API accepts a whole meter');
$rejected = false;
try {
    $controller->add_to_cart(['id' => $fabric->get_id(), 'quantity' => 1]);
} catch (Exception $error) {
    $rejected = true;
}
$check($rejected && WC()->cart->get_cart_contents_count() === 1, 'Repeated add cannot oversell one unit');
$request = new WP_REST_Request('POST', '/wc/store/v1/cart/update-item');
$request->set_body_params(['key' => $key, 'quantity' => 1.5]);
$response = rest_do_request($request);
$check($response->get_status() === 400 && $response->get_data()['code'] === 'np_invalid_quantity', 'Store API quantity updates reject fractional meters before rounding');
WC()->cart->empty_cart();
wc_clear_notices();
