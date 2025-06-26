<script>
    import {FilePdfSolid} from 'flowbite-svelte-icons';

    export let file;
</script>

{#if file.type.startsWith('image/')}
    <img src={file.url} alt="Document Thumbnail" class="w-full h-full object-cover rounded-md" />
{:else if file.type === 'application/pdf'}
    <FilePdfSolid class="w-10 h-10" />
{:else if file.type.includes('word')}
    <img src="/icons/doc-icon.png" alt="Word Document" class="w-full h-full object-cover rounded-md" />
{:else}
    <img src="/icons/file-icon.png" alt="Generic File" class="w-full h-full object-cover rounded-md" />
{/if}
