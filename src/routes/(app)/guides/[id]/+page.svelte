<script>
    import {Card, Spinner, Button, Label, Input, Accordion, AccordionItem} from 'flowbite-svelte';
    import { ArrowLeftOutline } from 'flowbite-svelte-icons';
    import { onMount } from "svelte";
    import { db } from '$lib'
    import {collection, doc, getDoc, orderBy, query, limit, getDocs, updateDoc} from "firebase/firestore";
    import { page } from "$app/stores";

    export let data; // Opcional, se estiver usando carregamento no server

    let guide = null;
    let documents = null;
    let loading = true;
    let error = null;

    let identificationNumberExpirationDate = "";
    let drivingLicenseExpirationDate = "";
    let insuranceExpirationDate = "";
    let insuranceWorkAccidentExpirationDate = "";
    let insurancePersonalAccidentExpirationDate = "";
    let vehicleInsuranceExpirationDate = "";

    async function approve(fieldName) {
        const documentsRef = collection(doc(db, "users", $page.params.id), "documents");
        const q = query(documentsRef, orderBy("submitDate", "desc"), limit(1));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const docRef = querySnapshot.docs[0].ref; // Use .ref to get the reference of the document

            // Update the specified field
            await updateDoc(docRef, {
                [fieldName]: "approved"
            });
            console.log(`Field "${fieldName}" updated to "approved".`);
        } else {
            console.log("No documents found to approve.");
        }
    }

    onMount(async () => {
        try {
            const id = $page.params.id;
            const guideRef = doc(db, "users", id);
            const guideSnap = await getDoc(guideRef);

            const documentsRef = collection(doc(db, "users", id), "documents");
            const q = query(documentsRef, orderBy("submitDate", "desc"), limit(1));
            const querySnapshot = await getDocs(q);

            if (guideSnap.exists()) {
                guide = guideSnap.data();
            } else {
                error = "Documento não encontrado!";
            }

            if (!querySnapshot.empty) {
                documents = querySnapshot.docs[0].data();

                if (documents.identificationNumberExpirationDate != null) {
                    identificationNumberExpirationDate = new Date(
                        documents.identificationNumberExpirationDate.seconds * 1000
                    ).toISOString().substring(0, 10);
                }

                if (documents.drivingLicenseExpirationDate != null) {
                    drivingLicenseExpirationDate = new Date(
                        documents.drivingLicenseExpirationDate.seconds * 1000
                    ).toISOString().substring(0, 10);
                }

                if (documents.insuranceExpirationDate != null) {
                    insuranceExpirationDate = new Date(
                        documents.insuranceExpirationDate.seconds * 1000
                    ).toISOString().substring(0, 10);
                }

                if (documents.insuranceWorkAccidentExpirationDate != null) {
                    insuranceWorkAccidentExpirationDate = new Date(
                        documents.insuranceWorkAccidentExpirationDate.seconds * 1000
                    ).toISOString().substring(0, 10);
                }

                if (documents.insurancePersonalAccidentExpirationDate != null) {
                    insurancePersonalAccidentExpirationDate = new Date(
                        documents.insurancePersonalAccidentExpirationDate.seconds * 1000
                    ).toISOString().substring(0, 10);
                }

                if (documents.vehicleInsuranceExpirationDate != null) {
                    vehicleInsuranceExpirationDate = new Date(
                        documents.vehicleInsuranceExpirationDate.seconds * 1000
                    ).toISOString().substring(0, 10);
                }
            }
        } catch (e) {
            error = "Erro ao carregar documento: " + e.message;
        } finally {
            loading = false;
        }
    });
</script>
<div class="w-full" style="margin: 20px">
    <Button outline color="dark" size="xs" on:click={() => history.back()}><ArrowLeftOutline class="w-4 h-4" /></Button>

    {#if loading}
        <p style="margin-top: 20px"><Spinner/> Loading Trip...</p>
    {:else if error}
        <p>{error}</p>
    {:else}
        <Card size="lg" style="margin-top: 20px">
            <div>
                <div class="mb-6">
                    <Label for="input-group-1" class="block mb-2">Name</Label>
                    <Input id="name" bind:value={guide.name} readonly/>
                </div>
                <div class="mb-6">
                    <Label for="input-group-1" class="block mb-2">Email</Label>
                    <Input id="name" bind:value={guide.email} readonly/>
                </div>
                <div class="mb-6">
                    <Label for="input-group-1" class="block mb-2">Phone</Label>
                    <Input id="name" bind:value={guide.phone} readonly/>
                </div>
            </div>
        </Card>
        <Card size="lg" style="margin-top: 20px">
            <p><strong>Submit Date:</strong> {new Date(documents.submitDate.seconds * 1000).toLocaleString()}</p>
            <Accordion style="margin-top: 20px; margin-bottom: 20px">
                <AccordionItem>
                    <span slot="header">Documento de Identificação</span>
                    <div class="mb-6">
                        <Label for="input-group-1" class="block mb-2">Nº CC/Passaporte</Label>
                        <Input id="name" bind:value={documents.identificationNumber} readonly/>
                    </div>
                    <div class="mb-6">
                        <Label for="input-group-1" class="block mb-2">Data de Validade</Label>
                        <Input id="name" bind:value={identificationNumberExpirationDate} readonly/>
                    </div>
                    <div class="mb-6">
                        <Label for="input-group-1" class="block mb-2">Carta de condução</Label>
                        <Input id="name" bind:value={documents.drivingLicenseNumber} readonly/>
                    </div>
                    <div class="mb-6">
                        <Label for="input-group-1" class="block mb-2">Data de Validade</Label>
                        <Input id="name" bind:value={drivingLicenseExpirationDate} readonly/>
                    </div>
                    <Button pill color="light" on:click={() => approve("identificationDocuments")}>Aprovar</Button>
                </AccordionItem>
                <AccordionItem>
                    <span slot="header">Comprovativo de Actividade</span>
                    <Button pill color="light" on:click={() => approve("activity")}>Aprovar</Button>
                </AccordionItem>
                <AccordionItem>
                    <span slot="header">Licença RNAAT</span>
                    <div class="mb-6">
                        <Label for="input-group-1" class="block mb-2">Nº Registo</Label>
                        <Input id="name" bind:value={documents.licenseRNAATNumber} readonly/>
                    </div>
                    <Button pill color="light" on:click={() => approve("licenseRNAAT")}>Aprovar</Button>
                </AccordionItem>
                <AccordionItem>
                    <span slot="header">Formação</span>
                    <Button pill color="light" on:click={() => approve("training")}>Aprovar</Button>
                </AccordionItem>
                <AccordionItem>
                    <span slot="header">Apólice de Seguro de Responsabilidade Civil</span>
                    <div class="mb-6">
                        <Label for="input-group-1" class="block mb-2">Companhia de Seguros</Label>
                        <Input id="name" bind:value={documents.insuranceCompanyName} readonly/>
                    </div>
                    <div class="mb-6">
                        <Label for="input-group-1" class="block mb-2">Nº Apólice</Label>
                        <Input id="name" bind:value={documents.insurancePolicyNumber} readonly/>
                    </div>
                    <div class="mb-6">
                        <Label for="input-group-1" class="block mb-2">Data de Validade</Label>
                        <Input id="name" bind:value={insuranceExpirationDate} readonly/>
                    </div>
                    <Button pill color="light" on:click={() => approve("civilLiabilityInsurancePolicy")}>Aprovar</Button>
                </AccordionItem>
                <AccordionItem>
                    <span slot="header">Apólice de seguro de Acidentes de trabalho</span>
                    <div class="mb-6">
                        <Label for="input-group-1" class="block mb-2">Companhia de Seguros</Label>
                        <Input id="name" bind:value={documents.insuranceWorkAccidentCompanyName} readonly/>
                    </div>
                    <div class="mb-6">
                        <Label for="input-group-1" class="block mb-2">Nº Apólice</Label>
                        <Input id="name" bind:value={documents.insuranceWorkAccidentPolicyNumber} readonly/>
                    </div>
                    <div class="mb-6">
                        <Label for="input-group-1" class="block mb-2">Data de Validade</Label>
                        <Input id="name" bind:value={insuranceWorkAccidentExpirationDate} readonly/>
                    </div>
                    <Button pill color="light" on:click={() => approve("workAccidentInsurancePolicy")}>Aprovar</Button>
                </AccordionItem>
                <AccordionItem>
                    <span slot="header">Apólice de Seguro de Acidentes Pessoais</span>
                    <div class="mb-6">
                        <Label for="input-group-1" class="block mb-2">Companhia de Seguros</Label>
                        <Input id="name" bind:value={documents.insurancePersonalAccidentCompanyName} readonly/>
                    </div>
                    <div class="mb-6">
                        <Label for="input-group-1" class="block mb-2">Nº Apólice</Label>
                        <Input id="name" bind:value={documents.insurancePersonalAccidentPolicyNumber} readonly/>
                    </div>
                    <div class="mb-6">
                        <Label for="input-group-1" class="block mb-2">Data de Validade</Label>
                        <Input id="name" bind:value={insurancePersonalAccidentExpirationDate} readonly/>
                    </div>
                    <Button pill color="light" on:click={() => approve("personalAccidentInsurancePolicy")}>Aprovar</Button>
                </AccordionItem>
                <AccordionItem>
                    <span slot="header">Dados do Veículo</span>
                    <div class="mb-6">
                        <Label for="input-group-1" class="block mb-2">Matrícula</Label>
                        <Input id="name" bind:value={documents.vehicleLicensePlate} readonly/>
                    </div>
                    <div class="mb-6">
                        <Label for="input-group-1" class="block mb-2">Lugares</Label>
                        <Input id="name" bind:value={documents.vehicleSeatsNumber} readonly/>
                    </div>
                    <div class="mb-6">
                        <Label for="input-group-1" class="block mb-2">Veículo Eléctrico</Label>
                        <Input id="name" bind:value={documents.vehicleType} readonly/>
                    </div>
                    <div class="mb-6">
                        <Label for="input-group-1" class="block mb-2">Companhia de Seguros</Label>
                        <Input id="name" bind:value={documents.vehicleInsuranceCompanyName} readonly/>
                    </div>
                    <div class="mb-6">
                        <Label for="input-group-1" class="block mb-2">Nº Apólice</Label>
                        <Input id="name" bind:value={documents.vehicleInsurancePolicyNumber} readonly/>
                    </div>
                    <div class="mb-6">
                        <Label for="input-group-1" class="block mb-2">Data de Validade</Label>
                        <Input id="name" bind:value={vehicleInsuranceExpirationDate} readonly/>
                    </div>
                    <Button pill color="light" on:click={() => approve("vehicleData")}>Aprovar</Button>
                </AccordionItem>
            </Accordion>
        </Card>

    {/if}
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
