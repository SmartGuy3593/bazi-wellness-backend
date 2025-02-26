const moment = require('moment');
const { DateTime } = require('luxon');
const calendar = require('calendar');
const fs = require('fs');
const csv = require('csv-parser');

let data = null;

const loadAndPreprocessData = async () => {
  const data = {};

  // Define Year Breaker
  data['year_2024_heavenly_element'] = "Jia";
  data['year_2024_branch'] = "Chen";
  data['year_2024_clash_heavenly_element'] = "Geng";
  data['year_2024_clash_branch'] = "Xu";

  // 2025 Year Pillar
  data['year_2025_heavenly_element'] = "Yi";
  data['year_2025_branch'] = "Si";

  // Feb 2025 Month Pillar
  data['month_feb_2025_heavenly_element'] = "Wu";
  data['month_feb_2025_branch'] = "Yin";

  // Hardcoded paths to the CSV files
  const datafiles_dir = "datafiles/";
  data['clash_csv_file_path'] = `${datafiles_dir}ClashCheck.csv`;
  data['favorable_csv_file_path'] = `${datafiles_dir}FavorableCheck.csv`;
  data['ideal_csv_file_path'] = `${datafiles_dir}IdealCheck.csv`;
  data['people_data_path'] = `${datafiles_dir}People-check.csv`;
  data['gods_data_path'] = `${datafiles_dir}TenGodsCheck.csv`;
  data['heavencombo_data_path'] = `${datafiles_dir}HeavenCombo-Check.csv`;
  data['heaven_clash_data_path'] = `${datafiles_dir}HeavenClash-Check.csv`;
  data['10gods_data_path'] = `${datafiles_dir}TenGodsCheck.csv`;
  data['hiddenstems_data_path'] = `${datafiles_dir}HiddenStemCheck.csv`;

  // Load the CSV files
  data['clash_data'] = await loadCsv(data['clash_csv_file_path']);
  data['favorable_data'] = await loadCsv(data['favorable_csv_file_path']);
  data['ideal_data'] = await loadCsv(data['ideal_csv_file_path']);
  data['people_data'] = await loadCsv(data['people_data_path']);
  data['gods_data'] = await loadCsv(data['gods_data_path']);
  data['heavencombo_data'] = await loadCsv(data['heavencombo_data_path']);
  data['heaven_clash_data'] = await loadCsv(data['heaven_clash_data_path']);
  data['10gods_data'] = await loadCsv(data['10gods_data_path']);
  data['hiddenstems_data'] = await loadCsv(data['hiddenstems_data_path']);

  // Load Day Pillar Officer Data for multiple months
  const day_pillar_officer_files = fs.readdirSync(datafiles_dir).filter(f => f.startsWith('Tongshu-2024') || f.startsWith('Tongshu-2025'));
  // const day_pillar_officer_dataframes = day_pillar_officer_files.map(async f => await loadCsv(`${datafiles_dir}${f}`));
  const day_pillar_officer_data = [];
  for (const f of day_pillar_officer_files) {
    day_pillar_officer_data.push(...await loadCsv(`${datafiles_dir}${f}`));
  }

  // const day_pillar_officer_data = day_pillar_officer_files.concat(day_pillar_officer_dataframes);


  // Create mappings
  data['branch_mapping'] = {
    "Zi": "Rat", "Chou": "Ox", "Yin": "Tiger", "Mao": "Rabbit",
    "Chen": "Dragon", "Si": "Snake", "Wu": "Horse", "Wei": "Goat",
    "Shen": "Monkey", "You": "Rooster", "Xu": "Dog", "Hai": "Pig"
  };
  data['elements_mapping'] = {
    "Jia": "Yang Wood", "Yi": "Yin Wood", "Bing": "Yang Fire",
    "Ding": "Yin Fire", "Wu": "Yang Earth", "Ji": "Yin Earth",
    "Geng": "Yang Metal", "Xin": "Yin Metal", "Ren": "Yang Water",
    "Gui": "Yin Water"
  };

  // Preprocess data
  data['clash_data'] = preprocessData(data['clash_data'], data['branch_mapping'], data['elements_mapping'], 'clash');
  data['favorable_data'] = preprocessData(data['favorable_data'], data['branch_mapping'], data['elements_mapping'], 'favorable');
  data['ideal_data'] = preprocessData(data['ideal_data'], data['branch_mapping'], data['elements_mapping'], 'ideal');
  data['heavenly_combo_data'] = preprocessData(data['heavencombo_data'], data['branch_mapping'], data['elements_mapping'], 'heavenly_combo');
  data['heaven_clash_data'] = preprocessData(data['heaven_clash_data'], data['branch_mapping'], data['elements_mapping'], 'heaven_clash');

  // Clean and preprocess the combined day_pillar_officer_data
  data['day_pillar_officer_data'] = cleanDayPillarOfficerData(day_pillar_officer_data, data['branch_mapping'], data['elements_mapping']);

  // Process people_data
  data['people_data'] = processPeopleData(data['people_data'], data['elements_mapping'], data['branch_mapping']);

  // Process 10 Gods data
  const column_mappings = {};
  for (const col of Object.keys(data['10gods_data'][0]).slice(2)) {  // Skip the first two columns
    const [pinyin, english] = col.split(' (');
    column_mappings[pinyin] = col;
    column_mappings[english.slice(0, -1)] = col;
  }

  // Store the column mappings in the data dictionary
  data['ten_gods_column_mappings'] = column_mappings;
  return data;
};

const loadCsv = (filePath) => {
  const results = [];
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
};

const preprocessData = (df, branch_mapping, elements_mapping, data_type) => {

  if (data_type === 'clash') {
    df.forEach((value, i) => {
      df[i]['Person Branch (English)'] = df[i]['Day Master Branch'].split('(')[1].split(')')[0].trim();
      df[i]['Clashes With (English)'] = df[i]['Clashes With'].split('(')[1].split(')')[0].trim();
      df[i]['Person Branch (Pinyin)'] = df[i]['Day Master Branch'].split(' ')[0].trim();
      df[i]['Clashes With (Pinyin)'] = df[i]['Clashes With'].split(' ')[0].trim();
    })
    // df['Person Branch (English)'] = df['Day Master Branch'].map(x => x.split('(')[1].split(')')[0].trim());
    // df['Clashes With (English)'] = df['Clashes With'].map(x => x.split('(')[1].split(')')[0].trim());
    // df['Person Branch (Pinyin)'] = df['Day Master Branch'].map(x => x.split(' ')[0].trim());
    // df['Clashes With (Pinyin)'] = df['Clashes With'].map(x => x.split(' ')[0].trim());
  } else if (data_type === 'favorable') {
    df.forEach((value, i) => {
      df[i]['Person Branch (English)'] = df[i]['Day Master Branch'].split('(')[1].split(')')[0].trim();
      df[i]['Favorable With (English)'] = df[i]['Favorable With'].split('(')[1].split(')')[0].trim();
      df[i]['Person Branch (Pinyin)'] = df[i]['Day Master Branch'].split(' ')[0].trim();
      df[i]['Favorable With (Pinyin)'] = df[i]['Favorable With'].split(' ')[0].trim();
    })
  } else if (data_type === 'ideal') {
    df.forEach((value, i) => {
      df[i]['Person Branch (English)'] = df[i]['Day Master Branch'].split('(')[1].split(')')[0].trim();
      df[i]['Person Branch (Pinyin)'] = df[i]['Day Master Branch'].split(' ')[0].trim();
      df[i]['Ideal With (English)'] = df[i]['Ideal With'].split('\n').map(branch => branch.split('(')[1].split(')')[0].trim());
    })
  } else if (data_type === 'heavenly_combo') {
    df.forEach((value, i) => {
      df[i]['Person Stem (English)'] = elements_mapping[df[i]['Person Stem']];
      df[i]['Person Stem (Pinyin)'] = df[i]['Person Stem'].split(' ')[0].trim();
      df[i]['Heaven Combo With (English)'] = elements_mapping[df[i]['Combo With']];
      df[i]['Heaven Combo With (Pinyin)'] = df[i]['Combo With'].split(' ')[0].trim();
    })
  } else if (data_type === 'heaven_clash') {
    df.forEach((value, i) => {
      df[i]['Person Stem (English)'] = elements_mapping[df[i]['Person Stem']];
      df[i]['Person Stem (Pinyin)'] = df[i]['Person Stem'].split(' ')[0].trim();
      df[i]['Heaven Clash With (English)'] = elements_mapping[df[i]['Clash With']];
      df[i]['Heaven Clash With (English)'] = df[i]['Clash With'].split(' ')[0].trim();
    })
  } else {
    throw new Error(`Unsupported data_type: ${data_type}`);
  }

  return df;
};

const cleanDayPillarOfficerData = (day_pillar_officer_data, branch_mapping, elements_mapping) => {
  day_pillar_officer_data.forEach((value, i) => {
    day_pillar_officer_data[i]['Date'] = moment(day_pillar_officer_data[i]['Date'].split(' ')[1], "MM/DD/YYYY").format("YYYY-MM-DD");
    // day_pillar_officer_data.fillna('None', inplace = True);
    day_pillar_officer_data[i]['Branch (Pinyin)'] = day_pillar_officer_data[i]['Day Pillar'].split(' ')[1];
    day_pillar_officer_data[i]['Branch (English)'] = branch_mapping[day_pillar_officer_data[i]['Branch (Pinyin)']];
    day_pillar_officer_data[i]['Heavenly Element (Pinyin)'] = day_pillar_officer_data[i]['Day Pillar'].split(' ')[0];
    day_pillar_officer_data[i]['Heavenly Element (English)'] = elements_mapping[day_pillar_officer_data[i]['Heavenly Element (Pinyin)']];
    if (Object.keys(day_pillar_officer_data[i]).indexOf('Month Pillar') > 0) {
      day_pillar_officer_data[i]['Month Branch (Pinyin)'] = day_pillar_officer_data[i]['Month Pillar'].split(' ')[1] || 'None';
      day_pillar_officer_data[i]['Month Branch (English)'] = branch_mapping[day_pillar_officer_data[i]['Month Branch (Pinyin)']];
      day_pillar_officer_data[i]['Month Heavenly Element (Pinyin)'] = day_pillar_officer_data[i]['Month Pillar'].split(' ')[0] || 'None';
      day_pillar_officer_data[i]['Month Heavenly Element (English)'] = elements_mapping[day_pillar_officer_data[i]['Month Heavenly Element (Pinyin)']];
    }
  })
  return day_pillar_officer_data;
};

const processPeopleData = (people_data, elements_mapping, branch_mapping) => {
  const splitPillarAndMap = (pillar) => {
    if (!pillar || pillar.trim() === "") {
      return [null, null, null, null];
    } else {
      const [heavenly_element_pinyin, earthly_branch_pinyin] = pillar.split(' ');
      const heavenly_element_english = elements_mapping[heavenly_element_pinyin];
      const earthly_branch_english = branch_mapping[earthly_branch_pinyin];
      return [heavenly_element_pinyin, earthly_branch_pinyin, heavenly_element_english, earthly_branch_english];
    }
  }

  people_data.forEach((value, i) => {
    // Process Day Pillar
    const day_pillar = splitPillarAndMap(people_data[i]['Day Pillar']);
    people_data[i]['Day Stem (Pinyin)'] = day_pillar[0];
    people_data[i]['Day Branch (Pinyin)'] = day_pillar[1];
    people_data[i]['Day Stem (English)'] = day_pillar[2];
    people_data[i]['Day Branch (English)'] = day_pillar[3];

    // Process Month Pillar
    const month_pillar = splitPillarAndMap(people_data[i]['Month Pillar']);
    people_data[i]['Month Stem (Pinyin)'] = month_pillar[0];
    people_data[i]['Month Branch (Pinyin)'] = month_pillar[1];
    people_data[i]['Month Stem (English)'] = month_pillar[2];
    people_data[i]['Month Branch (English)'] = month_pillar[3];

    // Process Year Pillar
    const year_pillar = splitPillarAndMap(people_data[i]['Year Pillar']);
    people_data[i]['Year Stem (Pinyin)'] = year_pillar[0];
    people_data[i]['Year Branch (Pinyin)'] = year_pillar[1];
    people_data[i]['Year Stem (English)'] = year_pillar[2];
    people_data[i]['Year Branch (English)'] = year_pillar[3];

    // Process Hour Pillar
    const hour_pillar = splitPillarAndMap(people_data[i]['Hour Pillar']);
    people_data[i]['Hour Stem (Pinyin)'] = hour_pillar[0];
    people_data[i]['Hour Branch (Pinyin)'] = hour_pillar[1];
    people_data[i]['Hour Stem (English)'] = hour_pillar[2];
    people_data[i]['Hour Branch (English)'] = hour_pillar[3];
  })

  return people_data;
};

const getBaziDetails = async (selected_person, people_data) => {
  data = await loadData();

  const person_data_row = people_data.find(row => row['Name'] === selected_person);
  if (!person_data_row) {
    throw new Error(`No data found for the selected person: ${selected_person}`);
  }

  const bazi_details = {};

  // Add Day Master
  bazi_details["day_master"] = person_data_row['Day Stem (English)'];
  // Get all hidden stems for the year, month, and day branches

  const year_hidden_stems = getHiddenStem(person_data_row['Year Branch (Pinyin)'], 'All', data['hiddenstems_data']);
  
  const month_hidden_stems = getHiddenStem(person_data_row['Month Branch (Pinyin)'], 'All', data['hiddenstems_data']);
  const day_hidden_stems = getHiddenStem(person_data_row['Day Branch (Pinyin)'], 'All', data['hiddenstems_data']);

  // Map the hidden stems to English and get the corresponding 10 Gods
  const year_hidden_elements = Object.values(year_hidden_stems)
    .filter(stem => stem)
    .map(stem => `${data['elements_mapping'][stem]} (${getTenGod(person_data_row['Day Stem (Pinyin)'], stem, data)})`);
  const month_hidden_elements = Object.values(month_hidden_stems)
    .filter(stem => stem)
    .map(stem => `${data['elements_mapping'][stem]} (${getTenGod(person_data_row['Day Stem (Pinyin)'], stem, data)})`);
  const day_hidden_elements = Object.values(day_hidden_stems)
    .filter(stem => stem)
    .map(stem => `${data['elements_mapping'][stem]} (${getTenGod(person_data_row['Day Stem (Pinyin)'], stem, data)})`);

  // Check if 'Hour Branch (Pinyin)' exists and get hidden stems if it does
  let hour_hidden_elements = [];
  if (person_data_row['Hour Branch (Pinyin)'] && person_data_row['Hour Branch (Pinyin)'] !== "N/A") {
    const hour_hidden_stems = getHiddenStem(person_data_row['Hour Branch (Pinyin)'], 'All', data['hiddenstems_data']);
    hour_hidden_elements = Object.values(hour_hidden_stems)
      .filter(stem => stem)
      .map(stem => `${data['elements_mapping'][stem]} (${getTenGod(person_data_row['Day Stem (Pinyin)'], stem, data)})`);
  }

  // Join the elements into a string, filtering out any empty strings
  const year_hidden_elements_str = year_hidden_elements.filter(Boolean).join(', ');
  const month_hidden_elements_str = month_hidden_elements.filter(Boolean).join(', ');
  const day_hidden_elements_str = day_hidden_elements.filter(Boolean).join(', ');
  const hour_hidden_elements_str = hour_hidden_elements.filter(Boolean).join(', ');

  // Add Natal Chart with hidden elements
  bazi_details["natal_chart"] = {
    "year_pillar": {
      "heavenly_stem": person_data_row['Year Stem (English)'],
      "earthly_branch": person_data_row['Year Branch (English)'],
      "hidden_elements": year_hidden_elements_str
    },
    "month_pillar": {
      "heavenly_stem": person_data_row['Month Stem (English)'],
      "earthly_branch": person_data_row['Month Branch (English)'],
      "hidden_elements": month_hidden_elements_str
    },
    "day_pillar": {
      "heavenly_stem": person_data_row['Day Stem (English)'],
      "earthly_branch": person_data_row['Day Branch (English)'],
      "hidden_elements": day_hidden_elements_str
    },
    "hour_pillar": {
      "heavenly_stem": person_data_row['Hour Stem (English)'],
      "earthly_branch": person_data_row['Hour Branch (English)'],
      "hidden_elements": hour_hidden_elements_str
    },
  };

  const cur_year_hidden_stems = getHiddenStem(data['year_2025_branch'], 'All', data['hiddenstems_data']);
  const cur_year_hidden_elements = Object.values(cur_year_hidden_stems)
    .filter(stem => stem)
    .map(stem => `${data['elements_mapping'][stem]} (${getTenGod(person_data_row['Day Stem (Pinyin)'], stem, data)})`);
  const cur_year_hidden_elements_str = cur_year_hidden_elements.filter(Boolean).join(', ');

  const cur_month_hidden_stems = getHiddenStem(data['month_feb_2025_branch'], 'All', data['hiddenstems_data']);
  const cur_month_hidden_elements = Object.values(cur_month_hidden_stems)
    .filter(stem => stem)
    .map(stem => `${data['elements_mapping'][stem]} (${getTenGod(person_data_row['Day Stem (Pinyin)'], stem, data)})`);
  const cur_month_hidden_elements_str = cur_month_hidden_elements.filter(Boolean).join(', ');

  bazi_details["current_annual_pillar"] = {
    "year": "2025",
    "heavenly_stem": data['elements_mapping'][data['year_2025_heavenly_element']],
    "earthly_branch": data['branch_mapping'][data['year_2025_branch']],
    "hidden_elements": cur_year_hidden_elements_str
  };

  bazi_details["current_monthly_pillar"] = {
    "month": "February 2025",
    "heavenly_stem": data['elements_mapping'][data['month_feb_2025_heavenly_element']],
    "earthly_branch": data['branch_mapping'][data['month_feb_2025_branch']],
    "hidden_elements": cur_month_hidden_elements_str
  };

  bazi_details["key_relationships"] = {
    "annual_pillar_to_day_master": {
      "heavenly_stem": "N/A",
      "hidden_elements": ''
    },
    "monthly_pillar_to_day_master": {
      "heavenly_stem": "N/A",
      "hidden_elements": ''
    },
  };
  return bazi_details;
};

const getPersonBazi = (selected_person, people_data) => {
  const person_data_row = people_data.find(row => row['Name'] === selected_person);
  if (!person_data_row) {
    throw new Error(`No data found for the selected person: ${selected_person}`);
  }

  return {
    "Day Branch English": person_data_row['Day Branch (English)'],
    "Day Branch Pinyin": person_data_row['Day Branch (Pinyin)'],
    "Month Branch English": person_data_row['Month Branch (English)'],
    "Month Branch Pinyin": person_data_row['Month Branch (Pinyin)'],
    "Year Branch English": person_data_row['Year Branch (English)'],
    "Year Branch Pinyin": person_data_row['Year Branch (Pinyin)'],
    "Day Stem English": person_data_row['Day Stem (English)'],
    "Day Stem Pinyin": person_data_row['Day Stem (Pinyin)'],
    "Month Stem English": person_data_row['Month Stem (English)'],
    "Month Stem Pinyin": person_data_row['Month Stem (Pinyin)'],
    "Year Stem English": person_data_row['Year Stem (English)'],
    "Year Stem Pinyin": person_data_row['Year Stem (Pinyin)']
  };
};

const getTenGod = (person_stem, match_stem, data) => {
  const ten_gods_data = data['10gods_data'];
  const column_mappings = data['ten_gods_column_mappings'];

  const column_name = column_mappings[person_stem];
  if (!column_name) {
    return null;
  }

  const row = ten_gods_data.find(row => row[column_name] === match_stem);
  if (row) {
    return row['10 Gods'];
  } else {
    return null;
  }
};

const getHiddenStem = (earthly_branch, stem_type, hiddenstems_data) => {
  if (!['Principle', 'Central', 'Residual', 'All'].includes(stem_type)) {
    throw new Error("stem_type must be one of 'Principle', 'Central', 'Residual', or 'All'");
  }

  const row = hiddenstems_data.find(row => row['Earthly Branch'] === earthly_branch);
  if (row) {
    if (stem_type === 'All') {
      return {
        Principle: row['Principle'],
        Central: row['Central'],
        Residual: row['Residual']
      };
    } else {
      return row[stem_type];
    }
  } else {
    return null;
  }
};

const checkHeavenlyCombo = (person_day_stem, person_month_stem, person_year_stem, todays_stem, heavencombo_data) => {
  const matches = [];

  // Check day stem
  const day_stem_combo = heavencombo_data.filter(row =>
    row['Person Stem (Pinyin)'] === person_day_stem &&
    row['Heaven Combo With (Pinyin)'] === todays_stem
  );
  if (day_stem_combo.length > 0) {
    matches.push('Day');
  }

  // Check month stem
  const month_stem_combo = heavencombo_data.filter(row =>
    row['Person Stem (Pinyin)'] === person_month_stem &&
    row['Heaven Combo With (Pinyin)'] === todays_stem
  );
  if (month_stem_combo.length > 0) {
    matches.push('Month');
  }

  // Check year stem
  const year_stem_combo = heavencombo_data.filter(row =>
    row['Person Stem (Pinyin)'] === person_year_stem &&
    row['Heaven Combo With (Pinyin)'] === todays_stem
  );
  if (year_stem_combo.length > 0) {
    matches.push('Year');
  }

  const matched = matches.length > 0;
  return { matched, matches };
};

const checkMonthClash = (person_year_branch, todays_month_branch, clash_data) => {
  const matches = [];

  const month_clash = clash_data.filter(row =>
    row['Person Branch (English)'] === person_year_branch &&
    row['Clashes With (English)'] === todays_month_branch
  );

  if (month_clash.length > 0) {
    matches.push('Month');
  }

  const matched = matches.length > 0;
  return { matched, matches };
};

const checkClash = (person_day_branch, person_month_branch, person_year_branch, todays_branch, clash_data) => {
  const matches = [];

  // Check day branch
  const day_clash = clash_data.filter(row =>
    row['Person Branch (English)'] === person_day_branch &&
    row['Clashes With (English)'] === todays_branch
  );
  if (day_clash.length > 0) {
    matches.push('Day');
  }

  // Check month branch
  const month_clash = clash_data.filter(row =>
    row['Person Branch (English)'] === person_month_branch &&
    row['Clashes With (English)'] === todays_branch
  );
  if (month_clash.length > 0) {
    matches.push('Month');
  }

  // Check year branch
  const year_clash = clash_data.filter(row =>
    row['Person Branch (English)'] === person_year_branch &&
    row['Clashes With (English)'] === todays_branch
  );
  if (year_clash.length > 0) {
    matches.push('Year');
  }

  const matched = matches.length > 0;
  return { matched, matches };
};

const checkPillarClash = (person_day_branch, person_month_branch, person_year_branch, person_day_stem, person_month_stem, person_year_stem, todays_branch, todays_stem, clash_data, heaven_clash_data) => {
  const matches = [];

  // Check branch and stem clash for Day
  const day_clash = clash_data.filter(row =>
    row['Person Branch (English)'] === person_day_branch &&
    row['Clashes With (English)'] === todays_branch
  );
  const day_stem_clash = heaven_clash_data.filter(row =>
    row['Person Stem (Pinyin)'] === person_day_stem &&
    row['Heaven Clash With (Pinyin)'] === todays_stem
  );
  if (day_clash.length > 0 && day_stem_clash.length > 0) {
    matches.push('Day');
  }

  // Check branch and stem clash for Month
  const month_clash = clash_data.filter(row =>
    row['Person Branch (English)'] === person_month_branch &&
    row['Clashes With (English)'] === todays_branch
  );
  const month_stem_clash = heaven_clash_data.filter(row =>
    row['Person Stem (Pinyin)'] === person_month_stem &&
    row['Heaven Clash With (Pinyin)'] === todays_stem
  );
  if (month_clash.length > 0 && month_stem_clash.length > 0) {
    matches.push('Month');
  }

  // Check branch and stem clash for Year
  const year_clash = clash_data.filter(row =>
    row['Person Branch (English)'] === person_year_branch &&
    row['Clashes With (English)'] === todays_branch
  );
  const year_stem_clash = heaven_clash_data.filter(row =>
    row['Person Stem (Pinyin)'] === person_year_stem &&
    row['Heaven Clash With (Pinyin)'] === todays_stem
  );
  if (year_clash.length > 0 && year_stem_clash.length > 0) {
    matches.push('Year');
  }

  const matched = matches.length > 0;
  return { matched, matches };
};

const checkFavorable = (person_day_branch, person_month_branch, person_year_branch, todays_branch, favorable_data) => {
  const matches = [];

  // Check day branch
  const day_favorable = favorable_data.filter(row =>
    row['Person Branch (English)'] === person_day_branch &&
    row['Favorable With (English)'] === todays_branch
  );
  if (day_favorable.length > 0) {
    matches.push('Day');
  }

  // Check month branch
  const month_favorable = favorable_data.filter(row =>
    row['Person Branch (English)'] === person_month_branch &&
    row['Favorable With (English)'] === todays_branch
  );
  if (month_favorable.length > 0) {
    matches.push('Month');
  }

  // Check year branch
  const year_favorable = favorable_data.filter(row =>
    row['Person Branch (English)'] === person_year_branch &&
    row['Favorable With (English)'] === todays_branch
  );
  if (year_favorable.length > 0) {
    matches.push('Year');
  }

  const matched = matches.length > 0;
  return { matched, matches };
};

const checkIdeal = (person_day_branch, person_month_branch, person_year_branch, todays_branch, ideal_data) => {
  const matches = [];

  // Check day branch
  const matches_day = ideal_data.filter(row => row['Person Branch (English)'] === person_day_branch);
  if (matches_day.length > 0) {
    const ideal_branches = matches_day[0]['Ideal With (English)'];
    if (ideal_branches.includes(todays_branch)) {
      matches.push('Day');
    }
  }

  // Check month branch
  const matches_month = ideal_data.filter(row => row['Person Branch (English)'] === person_month_branch);
  if (matches_month.length > 0) {
    const ideal_branches = matches_month[0]['Ideal With (English)'];
    if (ideal_branches.includes(todays_branch)) {
      matches.push('Month');
    }
  }

  // Check year branch
  const matches_year = ideal_data.filter(row => row['Person Branch (English)'] === person_year_branch);
  if (matches_year.length > 0) {
    const ideal_branches = matches_year[0]['Ideal With (English)'];
    if (ideal_branches.includes(todays_branch)) {
      matches.push('Year');
    }
  }

  const matched = matches.length > 0;
  return { matched, matches };
};

const formatBranches = (branch_list) => {
  if (!branch_list || branch_list.length === 0) {
    return '';
  }
  return branch_list.join(', ');
};

const mapBranchesToLetters = (branch_list) => {
  const mapping = { 'Day': 'D', 'Month': 'M', 'Year': 'Y' };
  return branch_list.map(branch => mapping[branch] || '').join('');
};

const generateCalendarData = (year, month, person, data) => {
  const calendar_data = {};
  const person_bazi = getPersonBazi(person, data['people_data']);

  const cal = new calendar.Calendar();
  const month_dates = cal.monthDates(year, month - 1);

  for (const week of month_dates) {
    for (const day of week) {
      if (day.getMonth() + 1 === month) {
        const todays_data = data['day_pillar_officer_data'].find(row => DateTime.fromJSDate(day).toISODate() === row['Date']);


        if (todays_data) {
          const todays_branch_english = todays_data['Branch (English)'];
          const todays_month_branch_english = todays_data['Month Branch (English)'];
          const todays_heavenly_element_pinyin = todays_data['Heavenly Element (Pinyin)'];
          const todays_heavenly_element_english = todays_data['Heavenly Element (English)'];
          const todays_day_officer = todays_data['Day Officer'];
          const todays_day_pillar = `${todays_heavenly_element_english} ${todays_branch_english}`;

          const emojis = [];
          const day_emojis = [];
          const month_emojis = [];
          const year_emojis = [];

          // Check for month clash
          const { matched: month_clash_exists, matches: month_clash_branches } = checkMonthClash(
            person_bazi["Year Branch English"],
            todays_month_branch_english,
            data['clash_data']
          );
          if (month_clash_exists) {
            emojis.push(`❗️️ M`);
          }

          // Check for clash
          const { matched: clash_exists, matches: clash_branches } = checkClash(
            person_bazi["Day Branch English"],
            person_bazi["Month Branch English"],
            person_bazi["Year Branch English"],
            todays_branch_english,
            data['clash_data']
          );
          if (clash_exists) {
            emojis.push(`💢 ${mapBranchesToLetters(clash_branches)}`);
            if (clash_branches.includes('Day')) {
              day_emojis.push('💢');
            }
            if (clash_branches.includes('Month')) {
              month_emojis.push('💢');
            }
            if (clash_branches.includes('Year')) {
              year_emojis.push('💢');
            }
          }

          // Check for favorable
          const { matched: favorable_exists, matches: favorable_branches } = checkFavorable(
            person_bazi["Day Branch English"],
            person_bazi["Month Branch English"],
            person_bazi["Year Branch English"],
            todays_branch_english,
            data['favorable_data']
          );
          if (favorable_exists) {
            emojis.push(`🌟 ${mapBranchesToLetters(favorable_branches)}`);
            if (favorable_branches.includes('Day')) {
              day_emojis.push('🌟');
            }
            if (favorable_branches.includes('Month')) {
              month_emojis.push('🌟');
            }
            if (favorable_branches.includes('Year')) {
              year_emojis.push('🌟');
            }
          }

          // Check for heavenly combo
          const { matched: heavenly_combo_exists, matches: heavenly_combo_stems } = checkHeavenlyCombo(
            person_bazi["Day Stem Pinyin"],
            person_bazi["Month Stem Pinyin"],
            person_bazi["Year Stem Pinyin"],
            todays_heavenly_element_pinyin,
            data['heavenly_combo_data']
          );
          if (heavenly_combo_exists) {
            emojis.push(`✨ ${mapBranchesToLetters(heavenly_combo_stems)}`);
          }

          // Check for ideal
          const { matched: ideal_exists, matches: ideal_branches } = checkIdeal(
            person_bazi["Day Branch English"],
            person_bazi["Month Branch English"],
            person_bazi["Year Branch English"],
            todays_branch_english,
            data['ideal_data']
          );
          if (ideal_exists) {
            emojis.push(`👍 ${mapBranchesToLetters(ideal_branches)}`);
            if (ideal_branches.includes('Day')) {
              day_emojis.push('👍');
            }
            if (ideal_branches.includes('Month')) {
              month_emojis.push('👍');
            }
            if (ideal_branches.includes('Year')) {
              year_emojis.push('👍');
            }
          }

          calendar_data[DateTime.fromJSDate(day).toISODate()] = {
            'day': day.getDate(),
            'emojis': emojis,
            'day_emojis': day_emojis,
            'month_emojis': month_emojis,
            'year_emojis': year_emojis,
            'Day Officer': todays_day_officer,
            'Day Pillar': todays_day_pillar
          };
        }
      }
    }
  }


  return calendar_data;
};

const generateStructCalendarData = (year, month, person, data) => {
  const calendar_data = {};
  const person_bazi = getPersonBazi(person, data['people_data']);

  const cal = new calendar.Calendar();
  const month_dates = cal.monthDates(year, month - 1);

  for (const week of month_dates) {
    for (const day of week) {
      if (day.getMonth() + 1 === month) {
        const todays_data = data['day_pillar_officer_data'].find(row => DateTime.fromJSDate(day).toISODate() === row['Date']);
        if (todays_data) {
          const todays_branch_english = todays_data['Branch (English)'];
          const todays_month_branch_english = todays_data['Month Branch (English)'];
          const todays_heavenly_element_pinyin = todays_data['Heavenly Element (Pinyin)'];
          const todays_heavenly_element_english = todays_data['Heavenly Element (English)'];
          const todays_day_officer = todays_data['Day Officer'];
          const todays_day_pillar = `${todays_heavenly_element_english} ${todays_branch_english}`;

          const emoji_data = {
            "Favorable": "",
            "Clash": "",
            "Ideal": "",
            "Heavenly": "",
            "Month Clash": ""
          };

          // Check for month clash
          const { matched: month_clash_exists, matches: month_clash_branches } = checkMonthClash(
            person_bazi["Year Branch English"],
            todays_month_branch_english,
            data['clash_data']
          );
          if (month_clash_exists) {
            emoji_data["Month Clash"] = "Yes";
          }

          // Check for clash
          const { matched: clash_exists, matches: clash_branches } = checkClash(
            person_bazi["Day Branch English"],
            person_bazi["Month Branch English"],
            person_bazi["Year Branch English"],
            todays_branch_english,
            data['clash_data']
          );
          if (clash_exists) {
            emoji_data["Clash"] = clash_branches.join(',') + ",";
          }

          // Check for favorable
          const { matched: favorable_exists, matches: favorable_branches } = checkFavorable(
            person_bazi["Day Branch English"],
            person_bazi["Month Branch English"],
            person_bazi["Year Branch English"],
            todays_branch_english,
            data['favorable_data']
          );
          if (favorable_exists) {
            emoji_data["Favorable"] = favorable_branches.join(',') + ",";
          }

          // Check for heavenly combo
          const { matched: heavenly_combo_exists, matches: heavenly_combo_stems } = checkHeavenlyCombo(
            person_bazi["Day Stem Pinyin"],
            person_bazi["Month Stem Pinyin"],
            person_bazi["Year Stem Pinyin"],
            todays_heavenly_element_pinyin,
            data['heavenly_combo_data']
          );
          if (heavenly_combo_exists) {
            emoji_data["Heavenly"] = heavenly_combo_stems.join(',') + ",";
          }

          // Check for ideal
          const { matched: ideal_exists, matches: ideal_branches } = checkIdeal(
            person_bazi["Day Branch English"],
            person_bazi["Month Branch English"],
            person_bazi["Year Branch English"],
            todays_branch_english,
            data['ideal_data']
          );
          if (ideal_exists) {
            emoji_data["Ideal"] = ideal_branches.join(',') + ",";
          }

          // Clean up the strings to remove trailing commas
          for (const key in emoji_data) {
            emoji_data[key] = emoji_data[key].replace(/,$/, '');
          }

          // Find the hidden element from the month pillar branch
          const month_pillar_branch_pinyin = todays_data['Month Branch (Pinyin)'];
          const month_pillar_hidden_stem = getHiddenStem(month_pillar_branch_pinyin, 'Principle', data['hiddenstems_data']);
          const monthly_ten_god = getTenGod(person_bazi["Day Stem Pinyin"], month_pillar_hidden_stem, data);

          calendar_data[DateTime.fromJSDate(day).toISODate()] = {
            'day': day.getDate(),
            'Favorable': emoji_data["Favorable"],
            'Clash': emoji_data["Clash"],
            'Ideal': emoji_data["Ideal"],
            'Heavenly': emoji_data["Heavenly"],
            'Month Clash': emoji_data["Month Clash"],
            'Day Officer': todays_day_officer,
            'Day Pillar': todays_day_pillar,
            'Month Ten God': monthly_ten_god
          };
        }
      }
    }
  }

  return calendar_data;
};

const performChecksForPersonAndDate = (selected_date, selected_person, data) => {
  const todays_results = {};
  const day_pillar_officer_data = data['day_pillar_officer_data'];
  const people_data = data['people_data'];
  const todays_data_row = day_pillar_officer_data.find(row => row['Date'] === selected_date.toISODate());

  if (todays_data_row) {
    const todays_branch_pinyin = todays_data_row['Branch (Pinyin)'];
    const todays_branch_english = todays_data_row['Branch (English)'];
    const todays_month_branch_english = todays_data_row['Month Branch (English)'];
    const todays_heavenly_element_pinyin = todays_data_row['Heavenly Element (Pinyin)'];
    const todays_heavenly_element_english = todays_data_row['Heavenly Element (English)'];
    const todays_officer = todays_data_row['Day Officer'];
    const person_bazi = getPersonBazi(selected_person, people_data);

    // Check for month clash
    const { matched: is_month_clash, matches: month_clash_branches } = checkMonthClash(
      person_bazi["Year Branch English"],
      todays_month_branch_english,
      data['clash_data']
    );

    const { matched: is_clash, matches: clash_branches } = checkClash(
      person_bazi["Day Branch English"],
      person_bazi["Month Branch English"],
      person_bazi["Year Branch English"],
      todays_branch_english,
      data['clash_data']
    );
    const { matched: is_favorable, matches: favorable_branches } = checkFavorable(
      person_bazi["Day Branch English"],
      person_bazi["Month Branch English"],
      person_bazi["Year Branch English"],
      todays_branch_english,
      data['favorable_data']
    );
    const { matched: is_ideal, matches: ideal_branches } = checkIdeal(
      person_bazi["Day Branch English"],
      person_bazi["Month Branch English"],
      person_bazi["Year Branch English"],
      todays_branch_english,
      data['ideal_data']
    );
    const { matched: is_heavenly_combo, matches: heavenly_combo_stems } = checkHeavenlyCombo(
      person_bazi["Day Stem Pinyin"],
      person_bazi["Month Stem Pinyin"],
      person_bazi["Year Stem Pinyin"],
      todays_heavenly_element_pinyin,
      data['heavenly_combo_data']
    );

    // Find the hidden element from the month pillar branch
    const month_pillar_branch_pinyin = todays_data_row['Month Branch (Pinyin)'];
    const month_pillar_hidden_stem = getHiddenStem(month_pillar_branch_pinyin, 'Principle', data['hiddenstems_data']);
    const monthly_ten_god = getTenGod(person_bazi["Day Stem Pinyin"], month_pillar_hidden_stem, data);

    todays_results["Date"] = selected_date.toFormat('EEE MM/dd/yyyy');
    todays_results["Day Pillar"] = `${todays_heavenly_element_english} ${todays_branch_english}`;
    todays_results["Day Officer"] = todays_officer;
    todays_results["Person's Day Pillar"] = `${person_bazi['Day Stem Pinyin']} ${person_bazi['Day Branch Pinyin']}`;
    todays_results["Month Ten God"] = monthly_ten_god;

    if (is_month_clash) {
      todays_results["Clash Month?"] = "⚠️ Month Clash";
    }

    if (is_clash) {
      todays_results["Clash or Neutral"] = `💢 Clash (${formatBranches(clash_branches)})`;
    }

    if (is_favorable) {
      todays_results["Favorable or Neutral"] = `🌟 Favorable (${formatBranches(favorable_branches)})`;
    }

    if (is_ideal) {
      todays_results["Ideal or Neutral"] = `👍 Ideal (${formatBranches(ideal_branches)})`;
    }
  }

  return todays_results;
};

const loadData = async () => {
  return await loadAndPreprocessData();
}

module.exports = { 
  loadData,
  getBaziDetails,
  checkPillarClash,
  generateCalendarData,
  generateStructCalendarData,
  performChecksForPersonAndDate
};