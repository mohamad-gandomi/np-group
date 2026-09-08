#!/bin/sh
set -eu

if ! wp core is-installed; then
  wp core install --url="http://localhost:${WP_PORT}" --title="گروه ان‌پی — محیط آزمایشی" \
    --admin_user="$WP_ADMIN_USER" --admin_password="$WP_ADMIN_PASSWORD" \
    --admin_email="$WP_ADMIN_EMAIL" --skip-email
  wp option update blog_public 0
  wp option update timezone_string Asia/Tehran
  wp rewrite structure '/%postname%/' --hard
fi

if ! wp plugin is-installed woocommerce; then
  wp plugin install "/workspace/packages/woocommerce-${WOOCOMMERCE_VERSION}.zip"
fi
wp plugin activate woocommerce
wp plugin activate np-group

wp eval-file /workspace/scripts/languages.php
wp site switch-language fa_IR

if ! wp option get np_group_local_configured >/dev/null 2>&1; then
  wp option update woocommerce_default_country IR
  wp option update woocommerce_currency IRR
  wp option update woocommerce_weight_unit kg
  wp option update woocommerce_dimension_unit cm
  wp option update woocommerce_manage_stock yes
  wp option update woocommerce_enable_guest_checkout yes
  wp option update woocommerce_allow_tracking no
  wp option update woocommerce_coming_soon no
  wp option update woocommerce_onboarding_profile '{"skipped":true}' --format=json
  wp option update np_group_local_configured 1
fi

wp rewrite flush --hard
wp plugin list --fields=name,status,version
printf '\nWordPress admin: http://localhost:%s/wp-admin/\n' "$WP_PORT"
