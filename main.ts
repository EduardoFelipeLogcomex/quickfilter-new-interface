import { mkdirSync, writeFileSync, existsSync, readdirSync, readFileSync } from 'fs'
import { knex } from 'knex'
import { join } from 'path'

const connection = knex({
  connection: {
   connectionString: '',
  },
  client: 'postgres'
})

const currentDir = process.cwd()

function loadCharts (): Promise<any> {
  return new Promise((resolve, reject) => {
    connection('charts').whereIn('chart_type_id', ['28ccb7dd-38b7-440e-9074-08dbf4bf16d4', '0681695f-fbb1-4c4f-bb5b-9404dea78e67', '8e76722b-daa4-491f-879d-35926a90d635'])
      .then(value => resolve(value))
      .catch(err => reject(err))
  })
}

function updateChart (chartId: number, paramsData: any): Promise<any> {
  return new Promise((resolve, reject) => {
    connection('charts').update({ params_data: paramsData }).where({ id: chartId })
      .then((result) => resolve(result))
      .catch((err) => reject(err))
  })
}

async function main() {
  if (process.argv[2]) {
    switch (process.argv[2]) {
      case 'load':
        await load()
        break
      case 'process':
        await applyQuickFilter(process.argv[3])
        break
      case 'save':
        await saveFiles(process.argv[3])
        break
    }
  }
}

async function saveFiles (path: string) {
  const folder = readdirSync(path)
  
  for (const file of folder) {
    if (file.includes('.json')) {
      const fileId = parseInt(file.split('.')[0])
      const fileContent = JSON.parse(readFileSync(join(path, file), { encoding: 'utf-8' }))
      
      const result = await updateChart(fileId, fileContent)
      console.log('Atualizando o gráfico: ', fileId, ' resultado: ', result)
    }
  }
}

async function load () {
  const date = new Date()
  const folder = join(currentDir, date.toISOString())
  mkdirSync(folder)

  const charts = await loadCharts()

  for (const chart of charts) {
    if (chart?.params_data.quickFilter) {
      console.log('escrevendo o gráfico: ', chart.id)
      writeFileSync(join(folder, `${chart.id}.json`), JSON.stringify(chart.params_data))
    }
  }
}

async function applyQuickFilter(folder: string) {
  const rootPath = join(currentDir, folder)
  
  if (!existsSync(rootPath)) {
    console.log('a pasta não existe')
    return
  }

  const modifyFolder = join(rootPath, 'modified')
  mkdirSync(modifyFolder)

  const charts = readdirSync(rootPath)
  
  for (const chartFile of charts) {
    const paramsData = JSON.parse(readFileSync(join(rootPath, chartFile), { encoding: 'utf8' }))

    if (paramsData.quickFilter?.enabled && !paramsData.quickFilter?.full_list_bind) {
      paramsData.quickFilter.dynamicTarget = 'full_list_column_2'
    }

    if (paramsData.quickFilter?.enabled && paramsData.quickFilter?.full_list_bind) {
      paramsData.quickFilter.dynamicTarget = paramsData.quickFilter.full_list_bind
      delete paramsData.quickFilter.full_list_bind
    }

    if (paramsData.quickFilter.enabled === undefined) {
      for (const [target, params] of Object.entries(paramsData.quickFilter)) {
        if ((params as { [key: string]: any })?.dynamicTarget) {
          continue
        }

        if ((params as { [key: string]: any }).full_list_bind) {
          paramsData.quickFilter[target].dynamicTarget = (params as any).full_list_bind
          delete paramsData.quickFilter[target].full_list_bind
        }

        if (!(params as { [key: string]: any }).quickFilter?.full_list_bind) {
          paramsData.quickFilter[target].dynamicTarget = 'full_list_column_2'
        }
      }
    }

    console.log('Escrevendo o gráfico: ', chartFile)
    writeFileSync(join(modifyFolder, chartFile), JSON.stringify(paramsData))
  }
}

main();
