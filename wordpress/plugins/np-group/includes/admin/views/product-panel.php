<?php
namespace NPGroup;

defined('ABSPATH') || exit;
?>
<div id="np-product-panel" class="panel woocommerce_options_panel hidden">
    <?php
    wp_nonce_field('np_save_product', 'np_product_nonce');
    woocommerce_wp_select([
        'id' => '_np_purchase_mode', 'label' => 'روش خرید', 'value' => purchase_mode($product),
        'options' => ['contact' => 'تماس برای سفارش', 'online' => 'خرید آنلاین'],
        'description' => 'محصولات تماسی با قیمت یا بدون قیمت قابل نمایش هستند؛ خرید اینترنتی ندارند.',
        'desc_tip' => true,
    ]);
    woocommerce_wp_select([
        'id' => '_np_sale_unit', 'label' => 'واحد فروش', 'value' => sale_unit($product),
        'options' => ['piece' => 'عدد / ست', 'meter' => 'متر'],
        'description' => 'برای پارچه، قیمت و موجودی را به ازای متر وارد کنید. فقط متراژ صحیح مجاز است.',
        'desc_tip' => true,
    ]);
    woocommerce_wp_text_input([
        'id' => '_np_lead_time', 'label' => 'زمان آماده‌سازی', 'value' => $product->get_meta('_np_lead_time'),
        'description' => 'مثلاً ۴ تا ۶ هفته؛ برای هماهنگی سفارش تلفنی.', 'desc_tip' => true,
    ]);
    ?>
    <div style="padding: 12px">
        <h4>مشخصات تکمیلی</h4>
        <p>برای فضای مناسب از برچسب‌ها و برای ویژگی‌های قابل فیلتر از ویژگی‌های ووکامرس استفاده کنید.</p>
        <table class="widefat" id="np-specifications">
            <thead><tr><th>عنوان</th><th>مقدار</th><th>ترتیب / حذف</th></tr></thead>
            <tbody>
                <?php foreach ($rows as $index => $row) : ?>
                    <?php require __DIR__ . '/specification-row.php'; ?>
                <?php endforeach; ?>
            </tbody>
        </table>
        <p><button type="button" class="button" id="np-add-specification">افزودن مشخصه</button></p>
        <template id="np-specification-template">
            <?php $index = '__INDEX__'; $row = ['title' => '', 'value' => '']; ?>
            <?php require __DIR__ . '/specification-row.php'; ?>
        </template>
    </div>
</div>
