const { Router } = require('express');
const { DateTime } = require('luxon');
const baziEngine = require('./lib/bazi_engine/index');

const {
    loadData,
    getBaziDetails,
    generateCalendarData,
    generateStructCalendarData,
    performChecksForPersonAndDate
} = baziEngine;

const router = Router();


router.get('/api/test', async (req, res) => {

    res.json({ test: "success" });
});

router.get('/api/people', async (req, res) => {
    console.log("GET localhost:5001/people");

    data = await loadData();
    const people = data['people_data'].map(row => row['Name']).sort();

    res.json(people);
});

router.get('/api/person_bazi', async (req, res) => {
    console.log("GET localhost:5001/person_bazi");

    const person_name = req.query.name;
    data = await loadData();

    if (!person_name) {
        return res.status(400).json({ error: "Person name is required" });
    }

    try {
        const person_bazi = await getBaziDetails(person_name, data['people_data']);
        res.json(person_bazi);
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
});

router.get('/api/calendar', async (req, res) => {
    console.log("GET localhost:5001/calendar");

    const year = parseInt(req.query.year) || DateTime.now().year;
    const month = parseInt(req.query.month) || DateTime.now().month;
    const person = req.query.person;
    data = await loadData();

    if (!person) {
        return res.status(400).json({ error: "Person name is required" });
    }

    const calendar_data = await generateCalendarData(year, month, person, data);
    res.json(calendar_data);
});

router.get('/api/calendar_struct', async (req, res) => {
    console.log("GET localhost:5001/calendar_struct");

    const year = parseInt(req.query.year) || DateTime.now().year;
    const month = parseInt(req.query.month) || DateTime.now().month;
    const person = req.query.person;
    data = await loadData();

    if (!person) {
        return res.status(400).json({ error: "Person name is required" });
    }

    const structured_calendar_data = generateStructCalendarData(year, month, person, data);
    res.json(structured_calendar_data);
});

router.get('/api/day_details', async (req, res) => {
    console.log("GET localhost:5001/day_details");

    const date = req.query.date;
    const person = req.query.person;
    data = await loadData();

    if (!date || !person) {
        return res.status(400).json({ error: "Date and person name are required" });
    }

    const selected_date = DateTime.fromISO(date);
    const day_details = performChecksForPersonAndDate(selected_date, person, data);

    res.json(day_details);
});

router.post('/api/ai_insight', async (req, res) => {
    console.log("Post localhost:5001/ai_insight");

    const { dayDetails, aiProvider } = req.body;

    if (!dayDetails || !aiProvider) {
        return res.status(400).json({ error: "Day details and AI provider are required" });
    }

    const prompt = constructPrompt(dayDetails);

    let response;
    if (aiProvider === 'Anthropic') {
        response = await getAnthropicResponse(prompt);
    } else if (aiProvider === 'OpenAI') {
        response = await getOpenaiResponse(prompt);
    } else {
        return res.status(400).json({ error: "Invalid AI provider" });
    }

    res.json({ ai_insight: response });
});

router.get('/api/ten_god', async (req, res) => {
    console.log("GET localhost:5001/ten_god");
    const person_stem = req.query.person_stem;
    const other_stem = req.query.other_stem;
    data = await loadData();

    if (!person_stem || !other_stem) {
        return res.status(400).json({ error: "Both person_stem and other_stem are required" });
    }

    const ten_god = getTenGod(person_stem, other_stem, data);
    if (ten_god) {
        res.json({ ten_god });
    } else {
        res.status(404).json({ error: "No matching 10 God found" });
    }
});

module.exports = router;
