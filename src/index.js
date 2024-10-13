import './styles/index.css'
import readXlsxFile from 'read-excel-file'
import { shopList } from './shops.js'

const inputAddFile = document.querySelector('.input-file-add')
const shopListRowTemplate = document.querySelector('#shopListRowTemplate').content
const tableShops = document.querySelector('.table-shop-list')
const optionShopRecieverTemplate = document.querySelector('#shopRecieverOptionTemplate').content

const inputItemId = document.querySelector('.input-item-id')
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
  const currentShopsArray = data.filter(shop => shop[0] !== '#ERROR_undefined' && shop[1] !== '#ERROR_undefined' && shop[2] !== '#ERROR_undefined')
  shopList.forEach(shopObject => {
    const currentShop = currentShopsArray.find(shop => shop[1] == shopObject.name)
    if (currentShop) {
      shopObject.itemValue = currentShop[2]
    }
  })
}

// Заполняем магазин количеством новых товаров (количество > 1 или Технопоинт или Склад)
function fillShopsWithSpecificItems(shop) {
  if (shop.type === 'Склад') {
    shop.notForEmptyValue = shop.itemValue - 1
  } else {
    shop.notForEmptyValue = Math.floor(shop.itemValue / 2)
  }
  if (shop.type === 'Технопоинт' || shop.type === 'Склад') {
    shop.newItemValue = shop.itemValue
  } else if (shop.itemValue > 1) {
    shop.newItemValue = shop.itemValue - 1
  }
}

function fillShopsWithRerenderFunction() {
  shopList.forEach(shop => {
    shop.renderResultTable = renderNewResultRow
  })
}
fillShopsWithRerenderFunction()

// Заполняет элемент выбора магазина-получателя опциями
function fillShopRecieverSelect() {
  shopList.forEach(shop => {
    if ('createShopRecieverOption' in shop) {
      selectShopReciever.append(shop.createShopRecieverOption(optionShopRecieverTemplate))
    }
  })
}
fillShopRecieverSelect()

function filterShipping() {
  // Исключаем магазины без товара
  let shippingList = shopList.filter(shop => shop.itemValue > 0)
  // resetCurrentShipValue()
  shippingList.forEach(shop => shop.fillToShipValue(shop.itemValue))
  // Исключаем филиал получатель
  if (selectShopReciever.value) {
    const currentReciever = shopList.find(shop => shop.name === selectShopReciever.value)
    shippingList = shippingList.filter(shop => shop.name !== currentReciever.name)
    shippingList.forEach(shop => shop.fillToShipValue(shop.itemValue))
  }
  // Исключаем магазины с витринными товарами
  if (checkboxItemNew.checked) {
    shippingList = shippingList.filter(shop => shop.newItemValue > 0)
    shippingList.forEach(shop => shop.fillToShipValue(shop.newItemValue))
  }
  // Исключаем склады
  if (checkboxNotWarehouse.checked) {
    shippingList = shippingList.filter(shop => shop.type !== 'Склад')
  }
  if (checkboxDontMakeEmpty.checked) {
    shippingList = shippingList.filter(shop => shop.notForEmptyValue > 0)
    shippingList.forEach(shop => shop.fillToShipValue(shop.notForEmptyValue))
  }
  console.log(shippingList)
  return shippingList
}

function disableButton(inputIsEmpty) {
  if (inputIsEmpty) {
    formAutoSubmitButton.disabled = true
    formAutoSubmitButton.classList.add('disabled')
  } else {
    formAutoSubmitButton.disabled = false
    formAutoSubmitButton.classList.remove('disabled')
  }
}

function uncheckShipOption(evt) {
  if (evt.target.checked) {
    evt.target === checkboxItemNew ? checkboxDontMakeEmpty.checked = false : checkboxItemNew.checked = false
  }
}

function clearResultTable() {
  const currentresultTable = [...tableResult.querySelectorAll('.table-row')]
  currentresultTable.forEach(element => element.remove())
}

function resetCurrentShipValue() {
  shopList.forEach(shop => shop.currentShipValue = 0)
}

function renderNewResultRow() {
  clearResultTable()
  filterShipping().forEach(shop => {
    if (shop.currentShipValue > 0) {
      const reciever = shopList.find(shop => shop.isCurrentReciever === true) ? shopList.find(shop => shop.isCurrentReciever === true) : ""
      tableResult.append(shop.createShippingListRowElement(shippingListRowTemplate, reciever.id, inputItemId.value))
    }
  })
}

selectShopReciever.addEventListener('change', evt => {
  shopList.forEach(shop => shop.makeThisShopReciever(false))
  const newShopReciever = shopList.find(shop => shop.name === evt.target.value)
  const recieverElement = [...tableShops.querySelectorAll('.table-data-shop-name')].find(element => element.textContent === newShopReciever.name)
  recieverElement.closest('.table-row').querySelector('.input-shipping-value').value = 0
  newShopReciever.makeThisShopReciever(true)
  filterShipping()
  renderNewResultRow()
})

inputAddFile.addEventListener('change', () => {
  readXlsxFile(inputAddFile.files[0])
    .then(excelData => {
      fillShopsWithValues(excelData)
      shopList.forEach(shop => {
        fillShopsWithSpecificItems(shop)
        if (shop.itemValue > 0) {
          tableShops.append(shop.createShopListRowElement(shopListRowTemplate))
        }
      })
    })
})

formAuto.addEventListener('submit', evt => {
  evt.preventDefault()
  clearResultTable()
  resetCurrentShipValue()
  let currentShippingValueTotal = 0
  const currentShippingList = filterShipping()
  const reciever = shopList.find(shop => shop.isCurrentReciever === true) ? shopList.find(shop => shop.isCurrentReciever === true) : ""
  for (let i = 0; i < +inputItemValue.value; i++) {
    // КОСЯК
    const currentNotFullShop = currentShippingList.find(shop => shop.currentShipValue < shop.toShipValue)
    currentNotFullShop.currentShipValue++
    currentShippingValueTotal++
    if (currentNotFullShop.currentShipValue === currentNotFullShop.toShipValue || currentShippingValueTotal === +inputItemValue.value) {
      tableResult.append(currentNotFullShop.createShippingListRowElement(shippingListRowTemplate, reciever.id, inputItemId.value))
    }
  }
})


inputItemId.addEventListener('change', renderNewResultRow)

inputItemValue.addEventListener('input', evt => {
  let isValueEmpty
  isValueEmpty = evt.target.value ? false : true
  disableButton(isValueEmpty)
})

checkboxItemNew.addEventListener('change', uncheckShipOption)
checkboxDontMakeEmpty.addEventListener('change', uncheckShipOption)


