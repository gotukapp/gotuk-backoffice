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
    let contactName = ''
    let phone = ''
    let email = ''
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
                contactName: contactName,
                email: email,
                phone: phone,
                orgCode: '',
                creationDate: serverTimestamp()
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
        <span style="height: 40px">Registar Empresa</span>
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
                            <Helper class='mt-2' color='red'><span class="font-medium">NIF inválido. Deve ter 9 dígitos e começar com 1, 2, 5, 6, 8 ou 9.</span></Helper>
                        {/if}
                    </div>
                    <div class="mb-6">
                        <Label for="input-group-1" class="block mb-2">Morada</Label>
                        <Input id="name" bind:value={address} required oninvalid={validateField}/>
                    </div>
                    <div class="mb-6">
                        <Label for="input-group-1" class="block mb-2">Nome do Responsável</Label>
                        <Input id="name" bind:value={contactName} required oninvalid={validateField}/>
                    </div>
                    <div class="row">
                        <div class="mb-6" style="float: left; width: 40%">
                            <Label for="input-group-1" class="block mb-2">Telefone</Label>
                            <div class="flex items-center space-x-2">
                                <Input type="number" id="name" bind:value={phone} required maxlength="12"/>
                            </div>
                        </div>
                        <div class="mb-6" style="float: right; width: 40%; margin-left: 5%">
                            <Label for="input-group-1" class="block mb-2">Email</Label>
                            <div class="flex items-center space-x-2">
                                <Input type="email" id="name" bind:value={email} required title="Formato de email inválido." />
                            </div>
                        </div>
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
    .row:after {
        content: "";
        display: table;
        clear: both;
    }
</style>
