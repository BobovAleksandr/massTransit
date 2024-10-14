import './styles/index.css'
import readXlsxFile from 'read-excel-file'
import { shopList, prioritySettings, recievers } from './shops.js'

const inputLoadFile = document.querySelector('.input-file-add')
const shopListRowTemplate = document.querySelector('#shopListRowTemplate').content
const tableShops = document.querySelector('.table-shop-list')

const inputItemId = document.querySelector('.input-item-id')
const optionShopRecieverTemplate = document.querySelector('#shopRecieverOptionTemplate').content
const selectShopReciever = document.querySelector('.select-shop-reciever')

const formAuto = document.forms['form-auto']
const formAutoSubmitButton = formAuto.elements['button-auto-submit']
const inputItemValue = formAuto.elements['input-item-value']
const checkboxItemNew = formAuto.elements['checkbox-item-new']
const checkboxNotWarehouse = formAuto.elements['checkbox-item-not-warehouse']
const checkboxDontMakeEmpty = formAuto.elements['checkbox-item-dont-to-make-empty']

const shippingListRowTemplate = document.querySelector('#resultRowTemplate').content
const tableResult = document.querySelector('.table-result')

// Заполняет магазины количеством товара из таблицы
function fillShopsWithValues(data) {
  shopList.forEach(shop => {
    shop.fillTotalValue(data)
    shop.fillItemSpecificValues()
  })
}
  
// Рендерит таблицу со списком магазинов (остаток > 0)
function renderShopTable() {
  shopList.forEach(shop => {
    if (shop.itemTotalValue > 0) {
      tableShops.append(
        shop.createShopListRowElement(shopListRowTemplate)
      )
    }
  })
}
  
// Рендерит опции выбора филиала-получателя
function renderRecieverOptions(recievers, template) {
  const filteredShoplist = shopList.filter(shop => recievers.includes(shop.name))
  filteredShoplist.forEach(shop => {
    selectShopReciever.append(
      shop.createShopRecieverOption(template)
    )
  })
}

// Заполняет филиалы числом-эквивалентом приоритетности отгрузки
function fillShopPriority(priority) {
  shopList.forEach(shop => {
    shop.calculatePriority(priority)
  })
  shopList.sort((a,b) => a.priority - b.priority)
}

// Обработка excel-файла и зпуск функций после неё  
inputLoadFile.addEventListener('change', () => {
  readXlsxFile(inputLoadFile.files[0])
    .then(excelData => {
      excelData = excelData.filter(shop => shop[0] !== '#ERROR_undefined' && shop[1] !== '#ERROR_undefined' && shop[2] !== '#ERROR_undefined' && shop[2] > 0)
      fillShopsWithValues(excelData)                                // Количетсов товаров
      fillShopPriority(prioritySettings)                            // Приоритетность отгрузки
      renderShopTable()                                             // Рендер таблицы филиалов
      renderRecieverOptions(recievers, optionShopRecieverTemplate)  // Рендер списка опций филиала-получателя
      console.log(shopList)
    })
})

