<script>
    import { locale } from '$lib/i18n';
</script>

<div class="w-full">
    <select bind:value={$locale}>
        <option value="en">English</option>
        <option value="pt">Português</option>
    </select>
</div>
