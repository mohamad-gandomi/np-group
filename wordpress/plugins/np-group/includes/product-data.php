<?php
namespace NPGroup;

defined('ABSPATH') || exit;

/** Variations inherit NP-specific settings; native price and inventory stay on the variation. */
function product_settings_owner(\WC_Product $product): \WC_Product
{
    return $product->is_type('variation')
        ? (wc_get_product($product->get_parent_id()) ?: $product)
        : $product;
}

function purchase_mode(\WC_Product $product): string
{
    return product_settings_owner($product)->get_meta('_np_purchase_mode') === 'online' ? 'online' : 'contact';
}

function sale_unit(\WC_Product $product): string
{
    return product_settings_owner($product)->get_meta('_np_sale_unit') === 'meter' ? 'meter' : 'piece';
}

/** Structured plain text: safe to render, with stable user-defined row order. */
function sanitize_specifications(mixed $rows): array
{
    if (!is_array($rows)) {
        return [];
    }
    $result = [];
    foreach (array_slice($rows, 0, 100) as $row) {
        if (!is_array($row) || !is_scalar($row['title'] ?? null) || !is_scalar($row['value'] ?? null)) {
            continue;
        }
        $title = sanitize_text_field((string) $row['title']);
        $value = sanitize_text_field((string) $row['value']);
        if ($title !== '' && $value !== '') {
            $result[] = ['title' => $title, 'value' => $value];
        }
    }
    return $result;
}
