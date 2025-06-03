<script>
    import {getStatusColor} from "$lib/utils.js";
    import {Badge} from "flowbite-svelte";

    export let document;
    const currentDate = new Date();
    const isExpired = () => {
        if (!document.expirationDate) return false;
        return document.expirationDate.toDate() < currentDate;
    };
</script>

<div class="mb-6">
    <Badge large color={isExpired() ? 'red' : getStatusColor(document?.status)}>{isExpired() ? 'EXPIRED' : (document?.status.toUpperCase() + ((document != null && document.submitDate != null) ? ' - Submetido a: ' + new Date(document.submitDate.seconds * 1000).toLocaleString() : ''))}</Badge>
</div>
