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

const currentShipValueElement = document.querySelector('.table-cell-value.section-shipping-info__table-cell')
const currentShipInfoStatusElement = document.querySelector('.section-shipping-info__status')
const currentShipInfoErrorElement = document.querySelector('.section-shipping-info__error')


const totalInfoWarehouseHeaders = [
  'Пермь Склад',
  'Екатеринбург Склад',
  'Челябинск Склад',
  'Сургут ТП',
]


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
  changeShipInfo()
}

// Очищает итоговую таблицу
function clearResultTable() {
  const tableResultArray = [...tableResult.children]
  tableResultArray.forEach((element, index) => {
    if (index > 0) element.remove()
  })
}

// Возвращает общее количество товаров
function getSumOfItemTotalValues() {
  return shopList.reduce((acc, shop) => {
      return acc + shop.itemTotalValue
    }, 0)
}

// Возвращает общее количество товаров не на витринах
function getSumOfItemNewValues() {
  return shopList.reduce((acc, shop) => {
      return acc + shop.itemNewValue
    }, 0)
}

// Возвращает элемент для заполнения количества товара по заголовку (строка)
function findCurrentheaderValueElement(header) {
  return [...document.querySelectorAll('.table-cell-name')].find(el => el.innerText === header).closest('.section-total-info__table-row').querySelector('.table-cell-value')
}

// Заполняет табличку с бщей инфой об остатках
function calculateTotalInfoSection() {
  totalInfoWarehouseHeaders.forEach(warehouseHeader => {
    findCurrentheaderValueElement(warehouseHeader).textContent = findShopObject(warehouseHeader).itemTotalValue
  })
  findCurrentheaderValueElement('Итого на филиалах').textContent = getSumOfItemTotalValues()
  findCurrentheaderValueElement('Из них не на витринах').textContent = getSumOfItemNewValues()
}

// Меняет количество отгружаемого товара в блоке инфы об отгрузках
function changeShipInfo() {
  const currentShipTotalValue = shopList.reduce((acc, shop) => {
    return acc + shop.currentShipValue
  }, 0)
  currentShipValueElement.textContent = currentShipTotalValue
  if (inputItemValue.value && currentShipTotalValue > 0) {
    let isOk = currentShipTotalValue >= inputItemValue.value
    changeShipInfoStatus(isOk)
    showShipInfoError(isOk, currentShipTotalValue)
  } else {
    currentShipInfoStatusElement.textContent = ''
    currentShipInfoErrorElement.textContent = ''
  }
}

// Меняет статус полноты объема отгрузок в блоке инфы об отгрузках
function changeShipInfoStatus(isOk) {
  const currentStatusText = isOk ? 'Все товары будут отгружены' : 'Не все товары будут отгружены'
  currentShipInfoStatusElement.textContent = currentStatusText
  isOk ? currentShipInfoStatusElement.classList.add('text-ok') : currentShipInfoStatusElement.classList.remove('text-ok')
}

// Отображает ошибку блока инфы об отгрузках
function showShipInfoError(isOk, currentShipValue) {
  let currentErrorText = isOk ? '' : `Не хватает ${inputItemValue.value - currentShipValue} штук.`
  currentShipInfoErrorElement.textContent = currentErrorText
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
      calculateTotalInfoSection()                                   // Заполняет табличку с бщей инфой об остатках
    })
})

// Слушатель смены инпута филиала-получателя
selectShopReciever.addEventListener('change', (evt) => {
  changeCurrentReciever(evt)                                        // Смена филиала-получателя
})

// Слушатель ввода количества товара для авто отгрузки
inputItemValue.addEventListener('input', (evt) => {
  disableSubmitButton(evt.target.value)                             // Активация \ деактивация кнопки "ОК"
  changeShipInfo()
})

// Слушатель изменения инпута кода товара
inputItemId.addEventListener('change', (evt) => {
  renderResultTable()                                               // Рендер таблицы результатов
})

formAuto.addEventListener('submit', (evt) => {
  evt.preventDefault()
})


