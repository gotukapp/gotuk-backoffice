<script>
    import {
        Card,
        Spinner,
        Button,
        Label,
        Input,
        TableBodyCell,
        TableHeadCell,
        TableBody,
        Table,
        TableHead, TableBodyRow, Badge, Accordion, AccordionItem
    } from 'flowbite-svelte';
    import { ArrowLeftOutline } from 'flowbite-svelte-icons';
    import { onMount } from "svelte";
    import { db } from '$lib'
    import {collection, doc, getDocs, limit, onSnapshot, orderBy, query, updateDoc, where} from "firebase/firestore";
    import { page } from "$app/stores";
    import { writable } from "svelte/store";
    import { authUser } from '$lib/stores/authUser.js'
    import {getAllFilesFromFolder, getStatusColor, formatDate} from "$lib/utils.js";

    let document = writable(null);
    let loading = true;
    let error = null;
    let tuks = writable([]);
    let users = writable([]);
    let unsubscribeOrgsDocuments;
    let orgDocuments = writable(null);
    let activityProofFiles = writable([]);

    onMount(() => {
        try {
            const id = $page.params.id;

            const docRef = doc(db, "organizations", id);

            // Listen for organization changes
            const unsubscribeOrg = onSnapshot(docRef, (docSnap) => {
                if (docSnap.exists()) {
                    document = docSnap.data();

                    const documentsRef = collection(doc(db, "organizations", id), "documents");
                    const queryDocuments = query(documentsRef, orderBy("submitDate", "desc"), limit(1));
                    unsubscribeOrgsDocuments = onSnapshot(queryDocuments, async (querySnapshot) => {
                        if (!querySnapshot.empty) {
                            orgDocuments = querySnapshot.docs[0].data();
                            activityProofFiles = await getAllFilesFromFolder(`uploads/organizations/${$page.params.id}/activityProof/${querySnapshot.docs[0].id}`)
                        }
                    })

                } else {
                    error = "Documento não encontrado!";
                }
            });

            if ($authUser.isAdmin) {
                // Listen for live updates in tuks
                const qTuks = query(collection(db, "tuktuks"), where("organizationRef", "==", docRef));
                const unsubscribeTuks = onSnapshot(qTuks, (querySnapshot) => {
                    tuks.set(querySnapshot.docs.map(doc => ({id: doc.id, ...doc.data()})));
                });

                // Listen for live updates in users
                const qUsers = query(collection(db, "users"), where("organizationRef", "==", docRef));
                console.log("Querying for tuktuks with organizationRef:", docRef.path);
                const unsubscribeUsers = onSnapshot(qUsers, (querySnapshot) => {
                    console.log("Users found:", querySnapshot.docs.length);
                    users.set(querySnapshot.docs.map(doc => ({id: doc.id, ...doc.data()})));
                });

                return () => {
                    unsubscribeOrg();
                    unsubscribeTuks();
                    unsubscribeUsers();
                };
            } else {
                return () => {
                    unsubscribeOrg();
                    unsubscribeOrgsDocuments();
                };
            }
        } catch (e) {
            error = "Erro ao carregar documento: " + e.message;
        } finally {
            loading = false;
        }
    });

    async function approve(fieldName) {
        const documentsRef = collection(doc(db, "organizations", $page.params.id), "documents");
        const q = query(documentsRef, orderBy("submitDate", "desc"), limit(1));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const docRef = querySnapshot.docs[0].ref;
            await updateDoc(docRef, { [fieldName]: "approved" });
            console.log(`Field "${fieldName}" updated to "approved".`);
        } else {
            console.log("No documents found to approve.");
        }
    }
</script>
<div class="w-full" style="margin: 20px">
    <Button outline color="dark" size="xs" on:click={() => history.back()}><ArrowLeftOutline class="w-4 h-4" /></Button>

    {#if loading}
        <p style="margin-top: 20px"><Spinner/> Loading Organization...</p>
    {:else if error}
        <p>{error}</p>
    {:else}
        <Card size="xl" style="margin-top: 20px">
            <div>
                <div class="mb-6">
                    <Label for="input-group-1" class="block mb-2">Name</Label>
                    <Input id="name" bind:value={document.name} readonly/>
                </div>
                <div class="mb-6">
                    <Label for="input-group-1" class="block mb-2">VAT</Label>
                    <Input id="name" bind:value={document.vat} readonly/>
                </div>
                <div class="mb-6">
                    <Label for="input-group-1" class="block mb-2">Address</Label>
                    <Input id="name" bind:value={document.address} readonly/>
                </div>
            </div>
        </Card>
        <Card size="xl" style="margin-top: 20px">
            <Accordion style="margin-top: 20px; margin-bottom: 20px">
                <AccordionItem>
                    {#if orgDocuments?.activityProof}
                        <Badge large color={getStatusColor(orgDocuments?.activityProof)}>{orgDocuments?.activityProof.toUpperCase()}</Badge>
                    {/if}
                    <span slot="header">Comprovativo de Actividade</span>
                    <div class="mb-6">
                        <Label for="input-group-1" class="block mb-2">Documentos</Label>
                        {#if activityProofFiles.length > 0}
                            <div class="flex gap-2 mt-2">
                                {#each activityProofFiles as file}
                                    <div class="relative w-20 h-20 previewImage">
                                        <a href={file} target="_blank" rel="noopener noreferrer">
                                            <img src={file} alt="Selected Image" class="w-full h-full object-cover rounded-md" />
                                        </a>
                                    </div>
                                {/each}
                            </div>
                        {/if}
                    </div>
                    {#if $authUser.isAdmin}
                        <Button pill color="blue" on:click={() => approve("activityProof")}>Aprovar</Button>
                    {/if}
                </AccordionItem>
                <AccordionItem>
                    {#if orgDocuments?.licenseRNAAT}
                        <Badge large color={getStatusColor(orgDocuments?.licenseRNAAT)}>{orgDocuments?.licenseRNAAT.toUpperCase()}</Badge>
                    {/if}
                    <span slot="header">Licença RNAAT</span>
                    <div class="mb-6">
                        <Label for="input-group-1" class="block mb-2">Nº Registo</Label>
                        <div id="insurance-company" class="readonly-input">{orgDocuments.licenseRNAATNumber}</div>
                    </div>
                    {#if $authUser.isAdmin}
                        <Button pill color="light" on:click={() => approve("licenseRNAAT")}>Aprovar</Button>
                    {/if}
                </AccordionItem>
                <AccordionItem>
                    {#if orgDocuments?.civilLiabilityInsurancePolicy}
                        <Badge large color={getStatusColor(orgDocuments?.civilLiabilityInsurancePolicy)}>{orgDocuments?.civilLiabilityInsurancePolicy.toUpperCase()}</Badge>
                    {/if}
                    <span slot="header">Apólice de Seguro de Responsabilidade Civil</span>
                    <div class="mb-6">
                        <Label for="input-group-1" class="block mb-2">Companhia de Seguros</Label>
                        <div id="insurance-company" class="readonly-input">{orgDocuments.insuranceCompanyName}</div>
                    </div>
                    <div class="mb-6">
                        <Label for="input-group-1" class="block mb-2">Nº Apólice</Label>
                        <div id="insurance-company" class="readonly-input">{orgDocuments.insurancePolicyNumber}</div>
                    </div>
                    <div class="mb-6">
                        <Label for="input-group-1" class="block mb-2">Data de Validade</Label>
                        <div id="insurance-company" class="readonly-input">{formatDate(orgDocuments?.insuranceExpirationDate)}</div>
                    </div>
                    {#if $authUser.isAdmin}
                        <Button pill color="light" on:click={() => approve("civilLiabilityInsurancePolicy")}>Aprovar</Button>
                    {/if}
                </AccordionItem>
                <AccordionItem>
                    {#if orgDocuments?.workAccidentInsurancePolicy}
                        <Badge large color={getStatusColor(orgDocuments?.workAccidentInsurancePolicy)}>{orgDocuments?.workAccidentInsurancePolicy.toUpperCase()}</Badge>
                    {/if}
                    <span slot="header">Apólice de Seguro de Acidentes de Trabalho</span>
                    <div class="mb-6">
                        <Label for="input-group-1" class="block mb-2">Companhia de Seguros</Label>
                        <div id="insurance-company" class="readonly-input">{orgDocuments.insuranceWorkAccidentCompanyName}</div>
                    </div>
                    <div class="mb-6">
                        <Label for="input-group-1" class="block mb-2">Nº Apólice</Label>
                        <div id="insurance-company" class="readonly-input">{orgDocuments.insuranceWorkAccidentPolicyNumber}</div>
                    </div>
                    <div class="mb-6">
                        <Label for="input-group-1" class="block mb-2">Data de Validade</Label>
                        <div id="insurance-company" class="readonly-input">{formatDate(orgDocuments?.insuranceWorkAccidentExpirationDate)}</div>
                    </div>
                    {#if $authUser.isAdmin}
                        <Button pill color="light" on:click={() => approve("workAccidentInsurancePolicy")}>Aprovar</Button>
                    {/if}
                </AccordionItem>
            </Accordion>
        </Card>
        {#if $authUser.isAdmin}
            <Card size="xl" style="margin-top: 20px">
                <Table >
                    <caption class="p-5 text-lg font-semibold text-left text-gray-900 bg-white dark:text-white dark:bg-gray-800">
                        Tuks
                    </caption>
                    <TableHead>
                        <TableHeadCell>License Plate</TableHeadCell>
                        <TableHeadCell>Seats</TableHeadCell>
                        <TableHeadCell>Electric</TableHeadCell>
                        <TableHeadCell>
                            <span class="sr-only">Edit</span>
                        </TableHeadCell>
                    </TableHead>
                    <TableBody tableBodyClass="divide-y">
                        {#each $tuks as tuk}
                            <TableBodyRow>
                                <TableBodyCell>{tuk.licensePlate}</TableBodyCell>
                                <TableBodyCell>{tuk.seats}</TableBodyCell>
                                <TableBodyCell>{tuk.electric}</TableBodyCell>
                                <TableBodyCell>
                                    <a href="/tuks/{tuk.id}" class="font-medium text-primary-600 hover:underline dark:text-primary-500">Ver</a>
                                </TableBodyCell>
                            </TableBodyRow>
                        {/each}
                    </TableBody>
                </Table>
            </Card>
            <Card size="xl" style="margin-top: 20px">
                <Table >
                    <caption class="p-5 text-lg font-semibold text-left text-gray-900 bg-white dark:text-white dark:bg-gray-800">
                        Guides
                    </caption>
                    <TableHead>
                        <TableHeadCell>Name</TableHeadCell>
                        <TableHeadCell>Email</TableHeadCell>
                        <TableHeadCell>Phone</TableHeadCell>
                        <TableHeadCell>Account Status</TableHeadCell>
                        <TableHeadCell>Rating</TableHeadCell>
                        <TableHeadCell>
                            <span class="sr-only">Ver</span>
                        </TableHeadCell>
                    </TableHead>
                    <TableBody tableBodyClass="divide-y">
                        {#each $users as user}
                            <TableBodyRow>
                                <TableBodyCell>{user.name}</TableBodyCell>
                                <TableBodyCell>{user.email}</TableBodyCell>
                                <TableBodyCell>{user.phone}</TableBodyCell>
                                <TableBodyCell>{user.accountValidated ? "Valid" : "Blocked"}</TableBodyCell>
                                <TableBodyCell>{user.rating}</TableBodyCell>
                                <TableBodyCell>
                                    <a href="/guides/{user.id}" class="font-medium text-primary-600 hover:underline dark:text-primary-500">Ver</a>
                                </TableBodyCell>
                            </TableBodyRow>
                        {/each}
                    </TableBody>
                </Table>
            </Card>
        {/if}
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
    .readonly-input {
        display: block;
        width: 100%;
        padding: 0.5rem;
        font-size: 1rem;
        color: #333;
        background-color: #f9f9f9;
        border: 1px solid #ddd;
        border-radius: 5px;
    }
</style>
