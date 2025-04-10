<script>
    import {getStatusColor} from "$lib/utils.js";
    import {Badge} from "flowbite-svelte";

    export let document;
</script>

<div class="mb-6">
    <Badge large color={getStatusColor(document?.status)}>{document?.status.toUpperCase()}{  (document != null && document.submitDate != null) ? ' - Submetido a: ' + new Date(document.submitDate.seconds * 1000).toLocaleString() : '' }</Badge>
</div>
