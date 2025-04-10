<script>
    import {CheckCircleSolid, FileSearchSolid} from "flowbite-svelte-icons";

    export let status;
</script>

{#if status === "approved"}
    <CheckCircleSolid color="green" />
{/if}
{#if status === "pending"}
    <FileSearchSolid color="grey" />
{/if}
