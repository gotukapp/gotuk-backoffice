<script>
    import FullCalendar from 'svelte-fullcalendar';
    import dayGridPlugin from '@fullcalendar/daygrid';
    import timeGridPlugin from '@fullcalendar/timegrid';
    import interactionPlugin from '@fullcalendar/interaction';
    import {onMount} from "svelte";
    import { page } from "$app/stores";
    import {Button} from "flowbite-svelte";
    import {ArrowLeftOutline} from "flowbite-svelte-icons";
    import {collection, doc, getDocs, query, where} from "firebase/firestore";
    import {db} from "$lib";
    import {getGuide} from "$lib/stores/guides.js";
    import {getTour} from "$lib/stores/tours.js";
    import {authUser} from '$lib/stores/authUser.js'

    let calendarRef;
    let dayCalendarRef;

    let selectedDate = new Date();
    let maxCount = 0;

    let monthOptions = {
        plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
        initialView: 'dayGridMonth',
        locale: 'pt-PT',
        timeZone: 'local',
        headerToolbar: {
            left: 'prev,next',
            center: 'title', // only show the title
            right: ''
        },
        dayCellDidMount: styleDayCell,
        dateClick: handleDateClick,
        eventDidMount: styleEvent,
    };

    let dayOptions = {
        plugins: [timeGridPlugin],
        initialView: 'timeGridDay',
        timeZone: 'local',
        locale: 'pt-PT',
        headerToolbar: {
            left: '',
            center: 'title', // only show the title
            right: ''
        },
        initialDate: selectedDate,
        eventDidMount: styleDayViewEvent,
    };

    let trips = [];
    let loading = true;
    let guideName = "";

    $: searchParams = $page.url.searchParams;
    $: guideId = searchParams.get('guideId') || null;
    $: orgId = searchParams.get('id') || null;
    $: filteredEvents = trips;

    $: if (!loading && calendarRef && filteredEvents) {
        buildEventCountMap(filteredEvents.filter(a => a.reserve === true));

        const api = calendarRef.getAPI();
        api.removeAllEvents();
        api.addEventSource(filteredEvents);

        const apiDayCalendar = dayCalendarRef.getAPI();
        apiDayCalendar.removeAllEvents();
        apiDayCalendar.addEventSource(filteredEvents);

        setTimeout(() => {
            restyleAllDayCells();
        }, 0);
    }

    $: if (orgId) {
        trips = [];
        getTripsForOrganization()
            .then(data => {
                trips = data;
            })
            .catch(error => {
                console.error("Error loading trips:", error);
            })
            .finally(() => {
                loading = false;
            });
    }

    function restyleAllDayCells() {
        const calendarApi = calendarRef?.getAPI();
        if (!calendarApi) return;

        const dayEls = calendarApi.el.querySelectorAll('.fc-daygrid-day');

        dayEls.forEach((el) => {
            const dateStr = el.getAttribute('data-date');
            const count = eventCountMap[dateStr] || 0;
            const color = getGreenColor(count);
            el.style.backgroundColor = color;
            el.style.transition = 'background-color 0.3s ease';
        });
    }

    function getEventStatusColor(status) {
        if (status === 'finished')
            return "green";
        if (status === 'started')
            return "gray";
        if (status === 'canceled')
            return "black";
        return '#3b82f6';
    }

    function styleEvent(info) {
        const isReserved = info.event.extendedProps.reserve;
        info.el.style.setProperty(
            '--fc-event-border-color',
            isReserved ? getEventStatusColor(info.event.extendedProps.status) : '#dc2626' // blue or red dot
        );
    }

    function styleDayViewEvent(info) {
        const isReserved = info.event.extendedProps.reserve;
        info.el.style.setProperty(
            '--fc-event-border-color',
            isReserved ? '#3b82f6' : '#dc2626' // blue or red dot
        );
        info.el.style.setProperty('background-color', isReserved ? '#3b82f6' : '#dc2626', 'important');
    }

    onMount(async () => {
        loading = true;

        getTripsForOrganization()
            .then(data => {
                trips = data;
            })
            .catch(error => {
                console.error("Error loading trips:", error);
            })
            .finally(() => {
                loading = false;
            });
    })

    async function allowUserAccess() {
        if (orgId) {
            return $authUser.user?.organizationRef.id === orgId;
        }

        if (guideId) {
            const guide = await getGuide(doc(db, "users", guideId))
            return $authUser.user?.organizationRef.id === guide.organizationRef.id;
        }
    }

    async function getTripsForOrganization() {
        if (!await allowUserAccess()) return [];
        const userRefs = [];

        if (guideId) {
            const guideRef = doc(db, "users", guideId)
            const guide = await getGuide(guideRef)
            guideName = guide.name;
            userRefs.push(guideRef)
        }

        if (orgId) {
            const organizationRef = doc(db, "organizations", orgId);
            const usersSnapshot = await getDocs(
                query(collection(db, "users"), where("organizationRef", "==", organizationRef))
            );
            userRefs.push(...usersSnapshot.docs.map(doc => doc.ref));
        }

        if (userRefs.length === 0) return [];

        const chunks = [];
        while (userRefs.length) chunks.push(userRefs.splice(0, 10));

        let allTrips = [];

        for (const chunk of chunks) {
            const tripsQuery = query(
                collection(db, "trips"),
                where("guideRef", "in", chunk)
            );

            const tripsSnapshot = await getDocs(tripsQuery);
            const trips = await Promise.all(
                tripsSnapshot.docs.map(async doc => {
                    const guide = await getGuide(doc.get("guideRef"));
                    const tour = await getTour(doc.get("tourId"));
                    const startDate = doc.get("date").toDate();
                    const endDate = new Date(startDate.getTime() + tour.duration * 60000); // duration in minutes

                    return {
                        id: doc.id,
                        title: guide.name + " - " + doc.get("persons") + "p - " + tour.name,
                        reserve: true,
                        start: startDate,
                        end: endDate,
                        ...doc.data()
                    };
                })
            );

            allTrips.push(...trips);
        }

        console.log("trips:", allTrips);

        return allTrips;
    }

    function handleDateClick(info) {
        selectedDate = new Date(info.dateStr);
        updateDayView();
    }

    function updateDayView() {
        const dayApi = dayCalendarRef?.getAPI();
        if (dayApi) {
            dayApi.gotoDate(selectedDate);
        }
    }

    let eventCountMap = {};

    function formatLocalDate(dateInput) {
        const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function buildEventCountMap(events) {
        eventCountMap = {};
        for (let e of events) {
            const day = formatLocalDate(e.start);
            eventCountMap[day] = (eventCountMap[day] || 0) + 1;
        }
        maxCount = Math.max(...Object.values(eventCountMap), 1);
    }

    function getGreenColor(count) {
        if (count === 0) return '#ffffff'; // white
        const percent = count / maxCount;
        const green = Math.round(255 - percent * 155);  // reduce red and blue
        return `rgb(${green}, 255, ${green})`; // pastel green scale
    }

    // Hook to customize each day cell
    function styleDayCell(info) {
        const dateStr = formatLocalDate(info.date);
        const count = eventCountMap[dateStr] || 0;
        const color = getGreenColor(count);

        info.el.style.backgroundColor = color;
        info.el.style.transition = 'background-color 0.3s ease';
    }

    function goToMonthView() {
        const calendar = calendarRef.getAPI();
        calendar.changeView('dayGridMonth');
    }

    // ⬇️ Add a listener for clicking the calendar's title
    function setupTitleClickHandler() {
        const calendar = calendarRef.getAPI();
        const el = calendar.el;
        const titleEl = el.querySelector('.fc-toolbar-title');

        if (titleEl) {
            titleEl.style.cursor = 'pointer';
            titleEl.addEventListener('click', goToMonthView);
        }
    }

    // ⬇️ Set up after calendar is mounted
    $: if (calendarRef) {
        setTimeout(setupTitleClickHandler, 100); // delay needed for DOM to be ready
    }
</script>

<div class="w-full mx-auto p-4">
    <div class="flex items-center justify-start gap-3 mb-4">
        <Button outline color="dark" size="xs" on:click={() => history.back()}>
            <ArrowLeftOutline class="w-4 h-4" />
        </Button>
        <h2 class="text-2xl font-semibold">Agenda {#if guideId} - {guideName}{/if}</h2>
    </div>

    <div class="calendar-container">
        <FullCalendar bind:this={calendarRef} options={monthOptions} />
        <FullCalendar bind:this={dayCalendarRef} options={dayOptions} />
    </div>
</div>
<style>
    .calendar-container {
        display: grid;
        grid-template-columns: 2fr 1fr;
        gap: 1rem;
    }
    /* Optional: prevent timeGrid columns from over-expanding */
    :global(.fc) {
        font-family: inherit;
    }

    :global(.fc .fc-timegrid-slot) {
        min-width: 50px;
    }

    :global(.fc-scroller) {
        max-height: 80vh;
    }

    :global(.fc-view-harness) {
        overflow-x: auto;
    }
</style>



