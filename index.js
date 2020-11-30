'use strict';

const POLL_TIMEOUT = 300000; // 5 min
const axios = require('axios');
const createAuthRefreshInterceptor = require('axios-auth-refresh').default;
axios.defaults.baseURL = process.env.DAEMONIT_API_BASE_URL || 'https://app.daemonit.com/api';

const sleep = (waitTimeInMs) => new Promise(resolve => setTimeout(resolve, waitTimeInMs));
let jwt_token = null;


// Use interceptor to inject the token to requests
axios.interceptors.request.use(request => {
	request.headers['authorization'] = `Bearer ${jwt_token}`;
	return request;
});

const refreshAuthLogic = async function auth(err = null) {
	await axios.post('/auth/login', {
		"username": process.env.DAEMONIT_API_USER,
		"password": process.env.DAEMONIT_API_PASS
	}).then(res => {
		if (err !== null) {
			jwt_token = res.headers.authorization;
			err.response.config.headers['authorization'] = `Bearer ${jwt_token}`;
		}
	});
}


function message_ok(message) {
	console.log(`✔️  ${message}`);
}

function message_err(message) {
	console.log(`❌ ${message}`);
}

function message_warn(message) {
	console.log(`⚠️  ${message}`);
}

async function createReport(url, engine_id) {
	const post_data = {
		url: url,
		engine: `/api/engines/${engine_id}`
	};

	return axios.post('/reports', post_data).then(response => {
		return response.data.uuid;
	});
}

async function get_report_stats(report_uuid) {
	return axios.get(`/reports/${report_uuid}`).then(resp => {
		switch (resp.data.status) {
			case 'new':
			case 'processing':
				return null;
			case 'done':
				return resp.data.stats;
			default:
				throw new Error(`Error fetch report`);
		}
	});
}

async function poll_stats(report_uuid) {
	let loop = true;
	let stats = null;

	let current_timeout = 0;
	const wait_time = 5000;

	message_ok('Waiting for report');

	do {
		if (current_timeout > POLL_TIMEOUT) {
			console.log(''); // new line
			throw new Error('Poll timeout');
		}
		stats = await get_report_stats(report_uuid);
		if (stats !== null) {
			loop = false;
		} else {
			await sleep(wait_time);
			current_timeout += wait_time;
			process.stdout.write('.');
		}
	}
	while (loop);

	return stats;
}

function parse_stats(stats) {
	const value_green = 85;
	const value_yellow = 70;

	console.log("\n+----------------+");
	console.log('|	 Score	  |');
	console.log("+----------------+");

	const fields = [
		{ key: 'scoreTotal', label: 'Score Total' },
		{ key: 'scoreAccessibility', label: 'Score Accessibility' },
		{ key: 'scoreBestPractices', label: 'Score Best Practices' },
		{ key: 'scoreGdpr', label: 'Score GDPR' },
		{ key: 'scoreHosting', label: 'Score Hosting and Security' },
		{ key: 'scorePerformance', label: 'Score Performance' },
		{ key: 'scoreQuality', label: 'Score Code Quality' },
		{ key: 'scoreSeo', label: 'Score SEO' }
	]

	fields.map((field) => {
		const message = `${field.label}: ${stats[field.key]}`;
		if (stats[field.key] >= 85) {
			message_ok(message);
		} else if (stats[field.key] >=value_yellow) {
			message_warn(message);
		} else {
			message_err(message);
		}
	});
}

function debug_input() {
	const envs = [
		{key: 'DAEMONIT_ENGINE_ID', hide: false, mandatory: false},
		{key: 'DAEMONIT_URL', hide: false, mandatory: true},
		{key: 'DAEMONIT_API_USER', hide: true, mandatory: true},
		{key: 'DAEMONIT_API_PASS', hide: true, mandatory: true},
	];


	console.log("+----------------+");
	console.log('| Check env vars | ')
	console.log("+----------------+");
	envs.map(x => {
		if (x.mandatory && (process.env[x.key] === undefined || process.env[x.key] === '')) {
			throw new Error(`${x.key} is mandatory`);
		}

		if (x.hide) {
			console.log(`${x.key} => *********`);
		} else {
			console.log(`${x.key} => ${process.env[x.key]}`);
		}
	});
}


(async () => {
	try {
		debug_input();
		message_ok('Env vars OK');
	} catch (err) {
		message_err(err.message);
		process.exit(1);
	}

	try {
		await refreshAuthLogic();
		message_ok('Auth OK');
	} catch (err) {
		message_err(`Auth fail ${err.message}`);
		process.exit(1);
	}

	try {
		createAuthRefreshInterceptor(axios, refreshAuthLogic);
		const report_uuid = await createReport(process.env.DAEMONIT_URL, process.env.DAEMONIT_ENGINE_ID);
		message_ok(`New report created: ${report_uuid}`);

		const stats = await poll_stats(report_uuid);
		parse_stats(stats);
	} catch (err) {
		message_err(err);
		process.exit(1);
	}
})();
