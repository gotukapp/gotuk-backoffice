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
        TableHead, TableBodyRow, Badge, Accordion, AccordionItem, Modal, Helper
    } from 'flowbite-svelte';
    import { ArrowLeftOutline } from 'flowbite-svelte-icons';
    import { onMount } from "svelte";
    import { db } from '$lib'
    import {
        collection,
        doc,
        getDocs,
        limit,
        onSnapshot,
        orderBy,
        query, serverTimestamp,
        setDoc,
        updateDoc,
        where
    } from "firebase/firestore";
    import { page } from "$app/stores";
    import { writable } from "svelte/store";
    import { authUser } from '$lib/stores/authUser.js'
    import {getAllFilesFromFolder, getStatusColor, formatDate, openFilePicker, uploadImages} from "$lib/utils.js";


    let document = $state(null);

    let editingAccidentInsurance = $state(false)
    let insuranceWorkAccidentExpirationDate = $state("")
    let insuranceWorkAccidentCompanyName = $state("")
    let insuranceWorkAccidentPolicyNumber = $state("")
    let editingCivilLiabilityInsurance = $state(false)
    let insuranceCivilLiabilityExpirationDate = $state("")
    let insuranceCivilLiabilityCompanyName = $state("")
    let insuranceCivilLiabilityPolicyNumber = $state("")
    let fileInput = $state(null)
    let selectedFiles =  $state([])
    let localPreviews = $state([])
    let uploadedUrls = $state([])
    let uploadProgress = $state(0)
    let isUploading = $state(false)

    let loading = $state(true);
    let error = $state(null);
    let tuks = writable([]);
    let users = writable([]);
    let unsubscribeWorkAccidentDocuments;
    let unsubscribeCivilLiabilityDocuments;
    let orgDocuments = writable(null);
    let workAccidentInsuranceData = $state(null);
    let civilLiabilityInsuranceData = $state(null);
    let workAccidentInsuranceFiles = $state([]);
    let civilLiabilityInsuranceFiles = $state([]);

    onMount(() => {
        try {
            const id = $page.params.id;

            const docRef = doc(db, "organizations", id);

            // Listen for organization changes
            const unsubscribeOrg = onSnapshot(docRef, (docSnap) => {
                if (docSnap.exists()) {
                    document = docSnap.data();

                    const documentsRef = collection(doc(db, "organizations", id), "workAccidentInsurance");
                    const queryDocuments = query(documentsRef, orderBy("submitDate", "desc"), limit(1));
                    unsubscribeWorkAccidentDocuments = onSnapshot(queryDocuments, async (querySnapshot) => {
                        if (!querySnapshot.empty) {
                            workAccidentInsuranceData = querySnapshot.docs[0].data();
                            workAccidentInsuranceFiles = await getAllFilesFromFolder(`uploads/organizations/${$page.params.id}/workAccidentInsurance/${querySnapshot.docs[0].id}`)
                        }
                    })

                    const civilLiabilityDocumentsRef = collection(doc(db, "organizations", id), "civilLiabilityInsurance");
                    const civilLiabilityQueryDocuments = query(civilLiabilityDocumentsRef, orderBy("submitDate", "desc"), limit(1));
                    unsubscribeCivilLiabilityDocuments = onSnapshot(civilLiabilityQueryDocuments, async (querySnapshot) => {
                        if (!querySnapshot.empty) {
                            civilLiabilityInsuranceData = querySnapshot.docs[0].data();
                            civilLiabilityInsuranceFiles = await getAllFilesFromFolder(`uploads/organizations/${$page.params.id}/civilLiabilityInsurance/${querySnapshot.docs[0].id}`)
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
                const qUsers = query(collection(db, "users"), where("organizationRef", "==", docRef)
                    , where("guideMode", "==", true));
                console.log("Querying for tuktuks with organizationRef:", docRef.path);
                const unsubscribeUsers = onSnapshot(qUsers, (querySnapshot) => {
                    console.log("Users found:", querySnapshot.docs.length);
                    users.set(querySnapshot.docs.map(doc => ({id: doc.id, ...doc.data()})));
                });

                return () => {
                    unsubscribeOrg();
                    unsubscribeTuks();
                    unsubscribeUsers();

                    unsubscribeWorkAccidentDocuments();
                    unsubscribeCivilLiabilityDocuments();
                };
            } else {
                return () => {
                    unsubscribeOrg();
                    unsubscribeWorkAccidentDocuments();
                    unsubscribeCivilLiabilityDocuments();
                };
            }
        } catch (e) {
            error = "Erro ao carregar documento: " + e.message;
        } finally {
            loading = false;
        }
    });

    function removeImage(index) {
        selectedFiles.splice(index, 1)
        localPreviews.splice(index, 1)
    }

    function selectFiles(event) {
        selectedFiles.push(...Array.from(event.target.files))
        localPreviews = selectedFiles.map(file => URL.createObjectURL(file))
    }

    async function submitWorkAccidentInsurance() {
        await submit("workAccidentInsurance", insuranceWorkAccidentCompanyName, insuranceWorkAccidentPolicyNumber, insuranceWorkAccidentExpirationDate)
        editingAccidentInsurance = false;
    }

    async function submitCivilLiabilityInsurance() {
        await submit("civilLiabilityInsurance", insuranceCivilLiabilityCompanyName, insuranceCivilLiabilityPolicyNumber, insuranceCivilLiabilityExpirationDate)
        editingCivilLiabilityInsurance = false;
    }

    async function submit(documentType, name, number, expirationDate) {
        isUploading = true
        const docRef = doc(collection(doc(db, "organizations", $page.params.id), documentType))
        await uploadImages(`uploads/organizations/${$page.params.id}/${documentType}/${docRef.id}`, selectedFiles, uploadProgress);
        await setDoc(docRef, {
            name: name,
            number: number,
            expirationDate: new Date(expirationDate),
            status: 'pending',
            submitDate: serverTimestamp()
        });

        isUploading = false
    }

    async function approve(documentType) {
        const documentsRef = collection(doc(db, "organizations", $page.params.id), documentType);
        const q = query(documentsRef, orderBy("submitDate", "desc"), limit(1));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const docRef = querySnapshot.docs[0].ref;
            await updateDoc(docRef, { status: "approved" });
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
                    <Label for="input-group-1" class="block mb-2">Code</Label>
                    <div id="insurance-company" class="readonly-input">{document?.orgCode}</div>
                </div>
                <div class="mb-6">
                    <Label for="input-group-1" class="block mb-2">Name</Label>
                    <div id="insurance-company" class="readonly-input">{document?.name}</div>
                </div>
                <div class="mb-6">
                    <Label for="input-group-1" class="block mb-2">VAT</Label>
                    <div id="insurance-company" class="readonly-input">{document?.vat}</div>
                </div>
                <div class="mb-6">
                    <Label for="input-group-1" class="block mb-2">Address</Label>
                    <div id="insurance-company" class="readonly-input">{document?.address}</div>
                </div>
            </div>
        </Card>
        <Card size="xl" style="margin-top: 20px">
            <Accordion style="margin-top: 20px; margin-bottom: 20px">
                <AccordionItem>
                    {#if orgDocuments?.activityProof}
                        <Badge large color={getStatusColor(orgDocuments?.activityProof)}>{orgDocuments?.activityProof.toUpperCase()}</Badge>
                    {/if}
                    <span slot="header">Comprovativo de Actividade ou Certidão Permanente</span>
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
                    {#if civilLiabilityInsuranceData?.status}
                        <Badge large color={getStatusColor(civilLiabilityInsuranceData?.status)}>{civilLiabilityInsuranceData?.status.toUpperCase()}</Badge>
                    {/if}
                    <span slot="header">Apólice de Seguro de Responsabilidade Civil</span>
                    <div class="mb-6">
                        <Label for="input-group-1" class="block mb-2">Companhia de Seguros</Label>
                        <div id="insurance-company" class="readonly-input">{civilLiabilityInsuranceData?.name}</div>
                    </div>
                    <div class="mb-6">
                        <Label for="input-group-1" class="block mb-2">Nº Apólice</Label>
                        <div id="insurance-company" class="readonly-input">{civilLiabilityInsuranceData?.number}</div>
                    </div>
                    <div class="mb-6">
                        <Label for="input-group-1" class="block mb-2">Data de Validade</Label>
                        <div id="insurance-company" class="readonly-input">{formatDate(civilLiabilityInsuranceData?.expirationDate)}</div>
                    </div>
                    <div class="mb-6">
                        <Label for="input-group-1" class="block mb-2">Documentos</Label>
                        {#if civilLiabilityInsuranceFiles.length > 0}
                            <div class="flex gap-2 mt-2">
                                {#each civilLiabilityInsuranceFiles as file}
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
                        <Button pill color="light" on:click={() => approve("submitCivilLiabilityInsurance")}>Aprovar</Button>
                    {/if}
                    {#if !$authUser.isAdmin}
                        <div>
                            <Button pill color="light" on:click={() => editingCivilLiabilityInsurance = true}>Novo</Button>
                            <Modal title="Apólice de Seguro de Responsabilidade Civil" bind:open={editingCivilLiabilityInsurance} autoclose={!isUploading}>
                                <div class="mb-6">
                                    <Label for="input-group-1" class="block mb-2">Companhia de Seguros</Label>
                                    <Input id="companyName" bind:value={insuranceCivilLiabilityCompanyName}/>
                                </div>
                                <div class="mb-6">
                                    <Label for="input-group-1" class="block mb-2">Nº Apólice</Label>
                                    <Input id="policyNumber" bind:value={insuranceCivilLiabilityPolicyNumber}/>
                                </div>
                                <div class="mb-6">
                                    <Label for="input-group-1" class="block mb-2">Data de Validade</Label>
                                    <Input id="expirationDate" type="date" bind:value={insuranceCivilLiabilityExpirationDate}/>
                                </div>
                                <div class="mb-6">
                                    <Label for="input-group-1" class="block mb-2">Documentos</Label>
                                    <Helper class='ml-3 mt-2' color='red'><span class="font-medium">- Condições da Apolice</span></Helper>
                                    <Helper class='ml-3 mt-2' color='red'><span class="font-medium">- Recibo de Pagamento</span></Helper>
                                    <input type="file" accept="image/*" bind:this={fileInput} multiple onchange={selectFiles} style="display: none" />
                                    {#if localPreviews.length > 0}
                                        <div class="flex gap-2 mt-2">
                                            {#each localPreviews as preview, index}
                                                <div class="relative w-20 h-20 previewImage">
                                                    <!-- Image Preview -->
                                                    <img src={preview} alt="Selected Image" class="w-full h-full object-cover rounded-md" />
                                                    <button class="absolute top-0 right-0 bg-red-500 text-white text-xs p-1 rounded-full" onclick={(event) => {event.stopPropagation(); removeImage(index)}} >
                                                        ✕
                                                    </button>
                                                </div>
                                            {/each}
                                        </div>
                                    {/if}
                                </div>
                                <Button color="blue" on:click={(event) => { event.stopPropagation(); openFilePicker(fileInput); }}>
                                    Adicionar
                                </Button>
                                <svelte:fragment slot="footer">
                                    <Button on:click={() => submitCivilLiabilityInsurance()}>Submeter</Button>
                                    {#if isUploading}
                                        <p>Uploading... {uploadProgress.toFixed(0)}%</p>
                                    {/if}
                                </svelte:fragment>
                            </Modal>
                        </div>
                    {/if}
                </AccordionItem>
                <AccordionItem>
                    <span slot="header">
                        Apólice de Seguro de Acidentes de Trabalho
                    </span>
                    {#if workAccidentInsuranceData?.status}
                        <div class="mb-6">
                            <Badge large color={getStatusColor(workAccidentInsuranceData?.status)}>{workAccidentInsuranceData?.status.toUpperCase()}</Badge>
                        </div>
                    {/if}
                    <div class="mb-6">
                        <Label for="input-group-1" class="block mb-2">Companhia de Seguros</Label>
                        <div id="insurance-company" class="readonly-input">{workAccidentInsuranceData.name}</div>
                    </div>
                    <div class="mb-6">
                        <Label for="input-group-1" class="block mb-2">Nº Apólice</Label>
                        <div id="insurance-company" class="readonly-input">{workAccidentInsuranceData.number}</div>
                    </div>
                    <div class="mb-6">
                        <Label for="input-group-1" class="block mb-2">Data de Validade</Label>
                        <div id="insurance-company" class="readonly-input">{formatDate(workAccidentInsuranceData?.expirationDate)}</div>
                    </div>
                    <div class="mb-6">
                        <Label for="input-group-1" class="block mb-2">Documentos</Label>
                        {#if workAccidentInsuranceFiles.length > 0}
                            <div class="flex gap-2 mt-2">
                                {#each workAccidentInsuranceFiles as file}
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
                        <Button pill color="light" on:click={() => approve("workAccidentInsurance")}>Aprovar</Button>
                    {/if}
                    {#if !$authUser.isAdmin}
                        <div>
                            <Button pill color="light" on:click={() => editingAccidentInsurance = true}>Novo</Button>
                            <Modal title="Apólice de Seguro de Acidentes de Trabalho" bind:open={editingAccidentInsurance} autoclose={!isUploading}>
                                <div class="mb-6">
                                    <Label for="input-group-1" class="block mb-2">Companhia de Seguros</Label>
                                    <Input id="companyName" bind:value={insuranceWorkAccidentCompanyName}/>
                                </div>
                                <div class="mb-6">
                                    <Label for="input-group-1" class="block mb-2">Nº Apólice</Label>
                                    <Input id="policyNumber" bind:value={insuranceWorkAccidentPolicyNumber}/>
                                </div>
                                <div class="mb-6">
                                    <Label for="input-group-1" class="block mb-2">Data de Validade</Label>
                                    <Input id="expirationDate" type="date" bind:value={insuranceWorkAccidentExpirationDate}/>
                                </div>
                                <div class="mb-6">
                                    <Label for="input-group-1" class="block mb-2">Documentos</Label>
                                    <input type="file" accept="image/*" bind:this={fileInput} multiple onchange={selectFiles} style="display: none" />
                                    {#if localPreviews.length > 0}
                                        <div class="flex gap-2 mt-2">
                                            {#each localPreviews as preview, index}
                                                <div class="relative w-20 h-20 previewImage">
                                                    <!-- Image Preview -->
                                                    <img src={preview} alt="Selected Image" class="w-full h-full object-cover rounded-md" />
                                                    <button class="absolute top-0 right-0 bg-red-500 text-white text-xs p-1 rounded-full" onclick={(event) => {event.stopPropagation(); removeImage(index)}} >
                                                        ✕
                                                    </button>
                                                </div>
                                            {/each}
                                        </div>
                                    {/if}
                                </div>
                                <Button color="blue" on:click={(event) => { event.stopPropagation(); openFilePicker(fileInput); }}>
                                    Adicionar
                                </Button>
                                <svelte:fragment slot="footer">
                                    <Button on:click={() => submitWorkAccidentInsurance()}>Submeter</Button>
                                    {#if isUploading}
                                        <p>Uploading... {uploadProgress.toFixed(0)}%</p>
                                    {/if}
                                </svelte:fragment>
                            </Modal>
                        </div>
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
