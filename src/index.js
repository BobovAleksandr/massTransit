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

const sectionResult = document.querySelector('.section-result')
const sectionResultCoverCheck = document.querySelector('.svg-check-icon')

const dialogAddFile = document.querySelector('.dialog-add-file')

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
function disableSubmitButton(itemsItemValueInputStatus, recieverInputStatus, itemIdInputStatus) {
  if (itemsItemValueInputStatus && recieverInputStatus && itemIdInputStatus) {
    formAutoSubmitButton.disabled = false
    formAutoSubmitButton.classList.remove('disabled')
  } else {
    formAutoSubmitButton.disabled = true
    formAutoSubmitButton.classList.add('disabled')
  }
}

// Рендерит итоговую таблицу
function renderResultTable() {
  if (inputItemId.value && selectShopReciever.value) {
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

// Возвращает общее количество товаров на складах
function getSumOfItemTotalWarehouseValues() {
  const warehouseList = shopList.filter(shop => shop.type === 'Склад')
  return warehouseList.reduce((acc, shop) => {
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
function findCurrentHeaderValueElement(header) {
  return [...document.querySelectorAll('.table-cell-name')].find(el => el.innerText === header).closest('.section-total-info__table-row').querySelector('.table-cell-value')
}

// Заполняет табличку с бщей инфой об остатках
function calculateTotalInfoSection() {
  const currentReciever = shopList.find(shop => shop.name === selectShopReciever.value)
  const currentRecieverTotalValue = currentReciever ? currentReciever.itemTotalValue : 0
  const currentRecieverNewValue = currentReciever ? currentReciever.itemNewValue : 0
  totalInfoWarehouseHeaders.forEach(warehouseHeader => {
    findCurrentHeaderValueElement(warehouseHeader).textContent = findShopObject(warehouseHeader).itemTotalValue
  })
  findCurrentHeaderValueElement('Итого на филиалах').textContent = (getSumOfItemTotalValues() - getSumOfItemTotalWarehouseValues() - currentRecieverTotalValue)
  findCurrentHeaderValueElement('Из них не на витринах').textContent = (getSumOfItemNewValues() - getSumOfItemTotalWarehouseValues() - currentRecieverNewValue)
}

// Возвращает текущую сумму отгружаемых товаров итого
function getCurrentShipTotalValue() {
  return shopList.reduce((acc, shop) => {
    return acc + shop.currentShipValue
  }, 0)
}

// Меняет количество отгружаемого товара в блоке инфы об отгрузках
function changeShipInfo() {
  const currentShipTotalValue = getCurrentShipTotalValue()
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

// Заполняет максимальное количество товаров для отгрузки в зависимости от настроек автоотгрузки
function fillItemToShipValues() {
  shopList.forEach(shop => {
    shop.itemToShipValue = checkboxItemNew.checked ? shop.itemNewValue :
                           checkboxDontMakeEmpty.checked ? shop.itemNotForEmptyValue :
                           shop.itemTotalValue
    if (checkboxNotWarehouse.checked && shop.type === 'Склад') {
      shop.itemToShipValue = 0
    }
  })
}

// Автоматически заполняет количество отгружаемых товаров
function autoCalculateShipValues() {
  resetAllCurrentShipValues()
  for (let i = 0; i < +inputItemValue.value; i++) {
    const currentNotFullShippedShop = shopList.find(shop => (shop.currentShipValue < shop.itemToShipValue && shop.isCurrentReciever === false))
    if (getCurrentShipTotalValue() < +inputItemValue.value && currentNotFullShippedShop) {
      let currentShipValue = currentNotFullShippedShop.currentShipValue + 1
      currentNotFullShippedShop.changeCurrentShipValue(currentShipValue, false)
      currentShipValue++
    }
  }
}

// Сбрасывает все выбранные отгрузки со всех илиалов
function resetAllCurrentShipValues() {
  shopList.forEach(shop => {
    shop.changeCurrentShipValue(0, false)
  })
}

// Копирует в буфер обмена инфу из итоговой таблицы
function copyResutTable() {
  let resultTable = ''
  const resultTableRowArray = [...document.querySelectorAll('.result-table-row')]
  resultTableRowArray.forEach(rowElement => {
    const shipId = rowElement.querySelector('.table-data-shop-shipper-id').textContent
    const recieverId = rowElement.querySelector('.table-data-shop-reciever-id').textContent
    const itemId = rowElement.querySelector('.table-data-shop-item-id').textContent
    const itemValue = rowElement.querySelector('.table-data-shop-shipping-value').textContent
    resultTable = resultTable + `${shipId}\t${recieverId}\t${itemId}\t${itemValue}\n`
  })
  navigator.clipboard.writeText(resultTable)
  .then(() => {
    console.log(resultTable);
  })
  .catch(() => {
    console.log("something went wrong");
  });
}

// Воспроизвоит анимацию галочки иконки копирования
function resultTableCoverAnimation() {
  sectionResultCoverCheck.classList.remove('hidden')
  setInterval(() => {
    sectionResultCoverCheck.classList.add('hidden')
  }, 1000);
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
      dialogAddFile.close()                                         // Закрыть окно выбора файла
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
  disableSubmitButton(inputItemValue.value, selectShopReciever.value, inputItemId.value)                             // Активация \ деактивация кнопки "ОК"
})

selectShopReciever.addEventListener('change', (evt) => {
  disableSubmitButton(inputItemValue.value, selectShopReciever.value, inputItemId.value)                             // Активация \ деактивация кнопки "ОК"
  calculateTotalInfoSection()
})

inputItemId.addEventListener('input', (evt) => {
  disableSubmitButton(inputItemValue.value, selectShopReciever.value, inputItemId.value)                             // Активация \ деактивация кнопки "ОК"
})

// Слушатель изменения инпута кода товара
inputItemId.addEventListener('change', (evt) => {
  renderResultTable()
  if (!inputItemId.value) {
    clearResultTable()                                              // Рендер таблицы результатов
  }                                              
})

sectionResult.addEventListener('click', () => {
  copyResutTable()                                                  // Скопировать результат
  resultTableCoverAnimation()                                       // Анимация статуса копирования
})

formAuto.addEventListener('submit', (evt) => {
  evt.preventDefault()
  fillItemToShipValues()                                            // Заполнить максимальное количестов товаров
  autoCalculateShipValues()                                         // Автоматически заполнить количество отгружаемых товаров
  changeShipInfo()                                                  // Обновление инфы об отгрузках
  renderResultTable()
})

dialogAddFile.showModal()