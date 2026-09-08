<?php
namespace NPGroup;

defined('ABSPATH') || exit;

function register_settings_page(): void
{
    add_action('admin_menu', static function () {
        add_options_page('تنظیمات ان‌پی', 'تنظیمات ان‌پی', 'manage_options', 'np-group', __NAMESPACE__ . '\\render_settings_page');
    });
    add_action('admin_init', static function () {
        register_setting('np_group', 'np_group_seller_phone', [
            'type' => 'string', 'sanitize_callback' => __NAMESPACE__ . '\\sanitize_phone', 'default' => '',
        ]);
    });
}

function sanitize_phone(mixed $value): string
{
    if (!is_string($value)) {
        return (string) get_option('np_group_seller_phone', '');
    }
    $value = strtr($value, array_combine(preg_split('//u', '۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩', -1, PREG_SPLIT_NO_EMPTY), str_split('01234567890123456789')));
    $phone = preg_replace('/[\s()\-]/u', '', $value);
    if ($phone === '' || preg_match('/^\+?[0-9]{8,15}$/', $phone)) {
        return $phone;
    }
    add_settings_error('np_group_seller_phone', 'invalid_phone', 'شماره تماس معتبر وارد کنید.');
    return (string) get_option('np_group_seller_phone', '');
}

function render_settings_page(): void
{
    if (!current_user_can('manage_options')) {
        return;
    }
    ?>
    <div class="wrap" dir="rtl">
        <h1>تنظیمات ان‌پی</h1>
        <form action="options.php" method="post">
            <?php settings_fields('np_group'); ?>
            <table class="form-table"><tr>
                <th><label for="np-seller-phone">شماره تماس فروشگاه</label></th>
                <td><input id="np-seller-phone" name="np_group_seller_phone" type="tel" dir="ltr" class="regular-text" value="<?php echo esc_attr(get_option('np_group_seller_phone', '')); ?>" />
                    <p class="description">شماره مشترک برای سفارش محصولات تماسی و هماهنگی ساخت.</p></td>
            </tr></table>
            <?php submit_button('ذخیره تنظیمات'); ?>
        </form>
    </div>
    <?php
}
