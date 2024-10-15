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

const tableResult = document.querySelector('.table-result')
const resultTableRowTemplate = document.querySelector('#resultRowTemplate').content


// ------------------------------ Функции


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
        shop.createShopListRowElement(shopListRowTemplate, renderResultTable)
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

// Переключает чекбоксы "Только не с витрины" и "Равномерная отгрузка"
function uncheckShipOption(evt) {
  if (evt.target.checked) {
    evt.target === checkboxItemNew ? checkboxDontMakeEmpty.checked = false : checkboxItemNew.checked = false
  }
}

// Возвращает объект магазина по названию (строка)
function findShopObject(name) {
  return shopList.find(shop => shop.name === name)
}

// Меняет филиал получатель
function changeCurrentReciever(evt) {
  const currentReciever = shopList.find(shop => shop.isCurrentReciever === true)
  if (currentReciever) currentReciever.makeThisShopReciever(false)
  const newReciever = findShopObject(evt.target.value)
  newReciever.makeThisShopReciever(true)
  newReciever.changeCurrentShipValue(0, renderResultTable)
}

// Активирует и деактивирует кнопку "ОК" исходя из заполненности инпута количества товара
function disableSubmitButton(inputIsEmpty) {
  if (inputIsEmpty) {
    formAutoSubmitButton.disabled = false
    formAutoSubmitButton.classList.remove('disabled')
  } else {
    formAutoSubmitButton.disabled = true
    formAutoSubmitButton.classList.add('disabled')
  }
}

// Рендерит итоговую таблицу
function renderResultTable() {
  clearResultTable()
  shopList.forEach(shop => {
    if (shop.currentShipValue > 0) {
      tableResult.append(
        shop.createResultRowElement(resultTableRowTemplate, findShopObject(selectShopReciever.value)?.id, inputItemId.value)
      )
    }
  })
}

// Очищает итоговую таблицу
function clearResultTable() {
  const tableResultArray = [...tableResult.children]
  tableResultArray.forEach((element, index) => {
    if (index > 0) element.remove()
  })
}


// ------------------------------ Слушатели


// Слушатели нажатия чекбоксов "Только не с витрины" и "Равномерная отгрузка"
checkboxItemNew.addEventListener('change', uncheckShipOption)
checkboxDontMakeEmpty.addEventListener('change', uncheckShipOption)

// Обработка excel-файла и зпуск функций после неё  
inputLoadFile.addEventListener('change', () => {
  readXlsxFile(inputLoadFile.files[0])
    .then(excelData => {
      excelData = excelData.filter(shop => shop[0] !== '#ERROR_undefined' && shop[1] !== '#ERROR_undefined' && shop[2] !== '#ERROR_undefined' && shop[2] > 0)
      fillShopsWithValues(excelData)                                // Количетсов товаров
      fillShopPriority(prioritySettings)                            // Приоритетность отгрузки
      renderShopTable()                                             // Рендер таблицы филиалов
      renderRecieverOptions(recievers, optionShopRecieverTemplate)  // Рендер списка опций филиала-получателя
    })
})

// Слушатель смены инпута филиала-получателя
selectShopReciever.addEventListener('change', (evt) => {
  changeCurrentReciever(evt)                                        // Смена филиала-получателя
})

// Слушатель ввода количества товара для авто отгрузки
inputItemValue.addEventListener('input', (evt) => {
  disableSubmitButton(evt.target.value)                             // Активация \ деактивация кнопки "ОК"
})

// Слушатель изменения инпута кода товара
inputItemId.addEventListener('change', (evt) => {
  renderResultTable()                                               // Рендер таблицы результатов
})



