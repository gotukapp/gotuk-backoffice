<script>
    import {CheckCircleSolid, CloseCircleSolid, FileSearchSolid} from "flowbite-svelte-icons";

    export let status;
    export let expirationDate;
    const currentDate = new Date();
    const isExpiringSoon = () => {
        if (!expirationDate?.toDate) return false;
        const valDate = expirationDate.toDate();
        const timeDiff = valDate.getTime() - currentDate.getTime();
        const daysLeft = timeDiff / (1000 * 60 * 60 * 24);
        return daysLeft <= 15 && daysLeft > 0;
    };

    const isExpired = () => {
        if (!expirationDate?.toDate) return false;
        return expirationDate.toDate() < currentDate;
    };
</script>

{#if status === "pending"}
    <FileSearchSolid color="grey" />
{:else if isExpired() && status === "approved"}
    <CloseCircleSolid color="red" />
{:else if isExpiringSoon() && status === "approved"}
    <CheckCircleSolid color="orange" />
{:else if status === "approved"}
    <CheckCircleSolid color="green" />
{/if}
