<?php defined('ABSPATH') || exit; ?>
<tr>
    <td><input style="width:100%" type="text" aria-label="عنوان مشخصه" name="np_specifications[<?php echo esc_attr($index); ?>][title]" value="<?php echo esc_attr($row['title']); ?>" /></td>
    <td><input style="width:100%" type="text" aria-label="مقدار مشخصه" name="np_specifications[<?php echo esc_attr($index); ?>][value]" value="<?php echo esc_attr($row['value']); ?>" /></td>
    <td>
        <button type="button" class="button" data-np-action="up" aria-label="انتقال به بالا">↑</button>
        <button type="button" class="button" data-np-action="down" aria-label="انتقال به پایین">↓</button>
        <button type="button" class="button" data-np-action="remove">حذف</button>
    </td>
</tr>
