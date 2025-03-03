import type { Application } from "express";
import { DateTime } from 'luxon';
import { isAuthenticated } from "@/middleware/isAuthenticated.ts";
import { isAuthorized } from "@/middleware/isAuthorized.ts";
import { test, permissions } from "@/helpers/index.ts";
import { signInWithPassword, signUp } from "@/handlers/auth/auth.handlers.js";
import {
  createWorkspace,
  fetchWorkspace,
  fetchWorkspacesByAccountId,
  updateWorkspace
} from "@/handlers/workspaces/workspaces.handlers.ts";
import { getAccount, getAccounts, createAccount, updateAccount } from "@/handlers/accounts/accounts.handlers.ts";
import { getProfile, getProfiles } from "@/handlers/profiles/profiles.handlers.ts";
import {
  loadData,
  getBaziDetails,
  generateCalendarData,
  generateStructCalendarData,
  performChecksForPersonAndDate
} from "@/lib/bazi_engine/index.ts";
import { supabase } from "@/services/supabase.ts";

import { constructPrompt, overviewPrompt, getAnthropicResponse, getOpenaiResponse } from "@/lib/openai/index.ts";

const { API_ROUTES } = permissions;

export const routes = async (app: Application) => {
  const data = await loadData();

  // @ts-expect-error no-unused-parameters
  app.get(API_ROUTES.root, isAuthenticated, isAuthorized, (req, res) => {
    res.send(`Routes are active! route: ${API_ROUTES.root} with test ${test}`);
  });
  app.post(API_ROUTES.login, isAuthenticated, isAuthorized, signInWithPassword);
  app.post(API_ROUTES.signUp, isAuthenticated, isAuthorized, signUp);

  app.get(API_ROUTES.accounts, isAuthenticated, isAuthorized, getAccounts);
  app.post(API_ROUTES.accounts, isAuthenticated, isAuthorized, createAccount);

  app.get(API_ROUTES.accountById, isAuthenticated, isAuthorized, getAccount);
  app.patch(API_ROUTES.accountById, isAuthenticated, isAuthorized, updateAccount);

  app.get(API_ROUTES.profiles, isAuthenticated, isAuthorized, getProfiles);

  app.get(API_ROUTES.profileById, isAuthenticated, isAuthorized, getProfile);

  app.get(API_ROUTES.workspaces, isAuthenticated, isAuthorized, fetchWorkspacesByAccountId);
  app.post(API_ROUTES.workspaces, isAuthenticated, isAuthorized, createWorkspace);

  app.get(API_ROUTES.workspaceById, isAuthenticated, isAuthorized, fetchWorkspace);
  app.patch(API_ROUTES.workspaceById, isAuthenticated, isAuthorized, updateWorkspace);

  app.get('/test', async (_req, res) => {
    res.json({ test: "success" });
  })

  app.get('/data', async (_req, res) => {
    res.json({ data: data });
  })

  app.get('/api/test', async (_req, res) => {

    res.json({ test: "success" });
  });

  app.get('/api/people', async (_req, res) => {
    console.log("GET localhost:5001/people");

    // data = await loadData();
    const people = data['people_data'].map(row => row['Name']).sort();

    res.json(people);
  });

  app.get('/api/person_bazi', async (req, res) => {
    console.log("GET localhost:5001/person_bazi");

    const person_name = req.query.name;
    // data = await loadData();

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

  app.get('/api/calendar', async (req, res) => {
    console.log("GET localhost:5001/calendar");

    const year = parseInt(req.query.year) || DateTime.now().year;
    const month = parseInt(req.query.month) || DateTime.now().month;
    const person = req.query.person;
    // data = await loadData();

    if (!person) {
      return res.status(400).json({ error: "Person name is required" });
    }

    const calendar_data = await generateCalendarData(year, month, person, data);
    res.json(calendar_data);
  });

  app.get('/api/calendar_struct', async (req, res) => {
    console.log("GET localhost:5001/calendar_struct");

    const year = parseInt(req.query.year) || DateTime.now().year;
    const month = parseInt(req.query.month) || DateTime.now().month;
    const person = req.query.person;
    // data = await loadData();

    if (!person) {
      return res.status(400).json({ error: "Person name is required" });
    }

    const structured_calendar_data = generateStructCalendarData(year, month, person, data);
    res.json(structured_calendar_data);
  });

  app.get('/api/day_details', async (req, res) => {
    console.log("GET localhost:5001/day_details");

    const date = req.query.date;
    const person = req.query.person;
    // data = await loadData();

    if (!date || !person) {
      return res.status(400).json({ error: "Date and person name are required" });
    }

    const selected_date = DateTime.fromISO(date);
    const day_details = performChecksForPersonAndDate(selected_date, person, data);

    res.json(day_details);
  });

  app.post('/api/ai_insight', async (req, res) => {
    console.log("POST localhost:5001/ai_insight");

    const { dayDetails, aiProvider } = req.body;
    console.log(req.body);

    if (!dayDetails || !aiProvider) {
      return res.status(400).json({ error: "Day details and AI provider are required" });
    }

    const prompt = constructPrompt(dayDetails);
    console.log(prompt);

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

  app.post('/api/ai_overview', async (req, res) => {
    console.log("POST localhost:5001/ai_overview");

    const { dayDetails, aiProvider } = req.body;

    if (!dayDetails || !aiProvider) {
      return res.status(400).json({ error: "Day details and AI provider are required" });
    }

    const prompt = overviewPrompt(dayDetails);
    console.log(prompt);

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

  app.get('/api/ten_god', async (req, res) => {
    console.log("GET localhost:5001/ten_god");
    const person_stem = req.query.person_stem;
    const other_stem = req.query.other_stem;
    // data = await loadData();

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

  app.post('/api/create_user', async (req, res) => {
    console.log("Post localhost:5001/create_user");
    const HeavenlyStem = [
      "Yang Earth",
      "Yin Earth",
      "Yang Metal",
      "Yin Metal",
      "Yang Fire",
      "Yin Fire",
    ];
    const EarthlyBranch = [
      "Dragon",
      "Rooster",
      "Snake",
    ];

    const insertData = {
      name: req.body.name,
      birth_date: req.body.birthDate,
      birth_time: req.body.birthTime,
      timezone: req.body.timezone,
      location: req.body.location,
      year_pillar_stem: HeavenlyStem[Math.floor(Math.random() * 6)],
      year_pillar_branch: EarthlyBranch[Math.floor(Math.random() * 3)],
      month_pillar_stem: HeavenlyStem[Math.floor(Math.random() * 6)],
      month_pillar_branch: EarthlyBranch[Math.floor(Math.random() * 3)],
      day_pillar_stem: HeavenlyStem[Math.floor(Math.random() * 6)],
      day_pillar_branch: EarthlyBranch[Math.floor(Math.random() * 3)],
      hour_pillar_stem: HeavenlyStem[Math.floor(Math.random() * 6)],
      hour_pillar_branch: EarthlyBranch[Math.floor(Math.random() * 3)],
      ai_overview: ""
    }

    const prompt = overviewPrompt({
      yearPillar: `${insertData.year_pillar_stem} ${insertData.year_pillar_branch}`,
      monthPillar: `${insertData.month_pillar_stem} ${insertData.month_pillar_branch}`,
      dayPillar: `${insertData.day_pillar_stem} ${insertData.day_pillar_branch}`,
      hourPillar: `${insertData.hour_pillar_stem} ${insertData.hour_pillar_branch}`,
    });

    console.log(prompt);

    const response = await getOpenaiResponse(prompt);
    console.log("response=================", response);

    insertData.ai_overview = response;

    // Assuming `supabase` is properly configured and imported
    try {
      const { data, error } = await supabase
        .from('users')
        .insert(insertData);
      if (error) {
        return res.status(500).json({ error: error.message });
      }
      res.json(data);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "An error occurred while fetching user data." });
    }
  });

  app.get('/api/get_user', async (req, res) => {
    console.log("Get localhost:5001/get_user");

    // Assuming `supabase` is properly configured and imported
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*');
      if (error) {
        return res.status(500).json({ error: error.message });
      }
      res.json(data);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "An error occurred while fetching user data." });
    }
  });

}
