"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const knex_1 = require("knex");
const path_1 = require("path");
const connection = (0, knex_1.knex)({
    connection: {
        connectionString: 'postgres://usr_plataformabi:JWYN%Q3YWFhh%r$@db_plataformabi.logcomex.io:5432/plataformabi',
    },
    client: 'postgres'
});
const currentDir = process.cwd();
function loadCharts() {
    return new Promise((resolve, reject) => {
        connection('charts').whereIn('chart_type_id', ['28ccb7dd-38b7-440e-9074-08dbf4bf16d4', '0681695f-fbb1-4c4f-bb5b-9404dea78e67', '8e76722b-daa4-491f-879d-35926a90d635'])
            .then(value => resolve(value))
            .catch(err => reject(err));
    });
}
function updateChart(chartId, paramsData) {
    return new Promise((resolve, reject) => {
        connection('charts').update({ params_data: paramsData }).where({ id: chartId })
            .then((result) => resolve(result))
            .catch((err) => reject(err));
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        if (process.argv[2]) {
            switch (process.argv[2]) {
                case 'load':
                    yield load();
                    break;
                case 'process':
                    yield applyQuickFilter(process.argv[3]);
                    break;
                case 'save':
                    yield saveFiles(process.argv[3]);
                    break;
            }
        }
    });
}
function saveFiles(path) {
    return __awaiter(this, void 0, void 0, function* () {
        const folder = (0, fs_1.readdirSync)(path);
        for (const file of folder) {
            if (file.includes('.json')) {
                const fileId = parseInt(file.split('.')[0]);
                const fileContent = JSON.parse((0, fs_1.readFileSync)((0, path_1.join)(path, file), { encoding: 'utf-8' }));
                const result = yield updateChart(fileId, fileContent);
                console.log('Atualizando o gráfico: ', fileId, ' resultado: ', result);
            }
        }
    });
}
function load() {
    return __awaiter(this, void 0, void 0, function* () {
        const date = new Date();
        const folder = (0, path_1.join)(currentDir, date.toISOString());
        (0, fs_1.mkdirSync)(folder);
        const charts = yield loadCharts();
        for (const chart of charts) {
            if (chart === null || chart === void 0 ? void 0 : chart.params_data.quickFilter) {
                console.log('escrevendo o gráfico: ', chart.id);
                (0, fs_1.writeFileSync)((0, path_1.join)(folder, `${chart.id}.json`), JSON.stringify(chart.params_data));
            }
        }
    });
}
function applyQuickFilter(folder) {
    var _a, _b, _c, _d, _e;
    return __awaiter(this, void 0, void 0, function* () {
        const rootPath = (0, path_1.join)(currentDir, folder);
        if (!(0, fs_1.existsSync)(rootPath)) {
            console.log('a pasta não existe');
            return;
        }
        const modifyFolder = (0, path_1.join)(rootPath, 'modified');
        (0, fs_1.mkdirSync)(modifyFolder);
        const charts = (0, fs_1.readdirSync)(rootPath);
        for (const chartFile of charts) {
            const paramsData = JSON.parse((0, fs_1.readFileSync)((0, path_1.join)(rootPath, chartFile), { encoding: 'utf8' }));
            if (((_a = paramsData.quickFilter) === null || _a === void 0 ? void 0 : _a.enabled) && !((_b = paramsData.quickFilter) === null || _b === void 0 ? void 0 : _b.full_list_bind)) {
                paramsData.quickFilter.dynamicTarget = 'full_list_column_2';
            }
            if (((_c = paramsData.quickFilter) === null || _c === void 0 ? void 0 : _c.enabled) && ((_d = paramsData.quickFilter) === null || _d === void 0 ? void 0 : _d.full_list_bind)) {
                paramsData.quickFilter.dynamicTarget = paramsData.quickFilter.full_list_bind;
                delete paramsData.quickFilter.full_list_bind;
            }
            if (paramsData.quickFilter.enabled === undefined) {
                for (const [target, params] of Object.entries(paramsData.quickFilter)) {
                    if (params === null || params === void 0 ? void 0 : params.dynamicTarget) {
                        continue;
                    }
                    if (params.full_list_bind) {
                        paramsData.quickFilter[target].dynamicTarget = params.full_list_bind;
                        delete paramsData.quickFilter[target].full_list_bind;
                    }
                    if (!((_e = params.quickFilter) === null || _e === void 0 ? void 0 : _e.full_list_bind)) {
                        paramsData.quickFilter[target].dynamicTarget = 'full_list_column_2';
                    }
                }
            }
            console.log('Escrevendo o gráfico: ', chartFile);
            (0, fs_1.writeFileSync)((0, path_1.join)(modifyFolder, chartFile), JSON.stringify(paramsData));
        }
    });
}
main();
