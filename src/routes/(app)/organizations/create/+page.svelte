<script>
    import {Card, Label, Input, Button, Helper} from 'flowbite-svelte'
    import { onMount } from "svelte"
    import {collection, doc, serverTimestamp, addDoc, updateDoc} from "firebase/firestore";
    import {db} from "$lib";
    import {goto} from "$app/navigation";
    import { auth } from '$lib';

    let name = ''
    let vat = ''
    let address = ''
    let vatError = false

    onMount(() => {
    });

    function validateVAT() {
        const vatRegex = /^[125689]\d{8}$/
        vatError = !vatRegex.test(vat);
    }

    function validateField(event) {
        if (!event.target.value.trim()) {
            event.target.setCustomValidity('Este campo é obrigatório!')
        } else {
            event.target.setCustomValidity('')
        }
    }
    async function submit(event) {
        event.preventDefault()

        const form = event.target
        if (form.checkValidity()) {
            validateVAT()
            if (vatError) return

            const docRef = await addDoc(collection(db, "organizations"), {
                address: address,
                vat: vat,
                name: name,
                submitDate: serverTimestamp()
            });
            await updateDoc(doc(db, "users", auth.currentUser.uid), {
                organizationRef: docRef
            })
            await goto('/organizations/' + docRef.id)
        } else {
            form.reportValidity()
        }


    }
</script>
<div class="w-full" style="margin: 20px">
    <Card size="xl" style="margin-top: 20px">
        <span style="height: 40px">Criar Organização</span>
            <form on:submit={submit}>
                <div>
                    <div class="mb-6">
                        <Label for="input-group-1" class="block mb-2">Nome</Label>
                        <Input id="name" bind:value={name} required oninvalid={validateField}/>
                    </div>
                    <div class="mb-6">
                        <Label for="input-group-1" class="block mb-2">NIF</Label>
                        <Input id="name" bind:value={vat} required oninvalid={validateField}/>
                        {#if vatError}
                            <Helper class='mt-2' color='red'><span class="font-medium">NIF inválido. Deve ter 9 dígitos e começar com 1, 2, 5, 6, 8 ou 9.</Helper>
                        {/if}
                    </div>
                    <div class="mb-6">
                        <Label for="input-group-1" class="block mb-2">Morada</Label>
                        <Input id="name" bind:value={address} required oninvalid={validateField}/>
                    </div>
                </div>
                <Button type="submit">Submeter</Button>
            </form>
    </Card>
</div>
<style>
    hr.double {
        background-color: #999;
        border: 0 none;
        color: #eee;
        height: 2px;
        margin-bottom: 10px;
    }
</style>
