// Get Instance for connection
import {
  ApiRest as requestRest,
  evaluateResponse
} from '@/api/ADempiere/instances.js'
import { isEmptyValue } from '@/utils/ADempiere'

/**
 * method in api/price-checking.js as requestGetProductPrice
 * @author elsiosanchez <elsiosanches@gmail.com>
 */
export { requestGetProductPrice as findProduct } from '@/api/ADempiere/form/price-checking.js'
export { requestGetConversionRate } from '@/api/ADempiere/system-core.js'

// List Point of sales
export function requestGetPointOfSales({
  posUuid
}) {
  return requestRest({
    url: '/pos/get-point-of-sales',
    data: {
      point_of_sales_uuid: posUuid
    }
  })
    .then(evaluateResponse)
    .then(posResponse => {
      const { convertPointOfSales } = require('@/utils/ADempiere/apiConverts/pos.js')

      return convertPointOfSales(posResponse)
    })
}

// List Point of sales
export function requestListPointOfSales({
  userUuid,
  pageSize,
  pageToken
}) {
  return requestRest({
    url: '/pos/list-point-of-sales',
    data: {
      user_uuid: userUuid
    },
    params: {
      page_size: pageSize,
      page_token: pageToken
    }
  })
    .then(evaluateResponse)
    .then(posListResponse => {
      const { convertPointOfSales } = require('@/utils/ADempiere/apiConverts/pos.js')

      return {
        nextPageToken: posListResponse.next_page_token,
        recordCount: posListResponse.record_count,
        sellingPointsList: posListResponse.records.map(pos => {
          return convertPointOfSales(pos)
        })
      }
    })
}

// Create order from POS
export function requestCreateOrder({
  posUuid,
  customerUuid,
  documentTypeUuid,
  salesRepresentativeUuid
}) {
  return requestRest({
    url: '/pos/create-order',
    data: {
      pos_uuid: posUuid,
      customer_uuid: customerUuid,
      document_type_uuid: documentTypeUuid,
      sales_representative_uuid: salesRepresentativeUuid
    }
  })
    .then(evaluateResponse)
    .then(createOrderResponse => {
      const { convertOrder } = require('@/utils/ADempiere/apiConverts/pos.js')

      return convertOrder(createOrderResponse)
    })
}

// Update order from POS
export function requestUpdateOrder({
  orderUuid,
  posUuid,
  customerUuid,
  description
}) {
  return requestRest({
    url: '/pos/update-order',
    data: {
      order_uuid: orderUuid,
      pos_uuid: posUuid,
      customer_uuid: customerUuid,
      description
    }
  })
    .then(evaluateResponse)
    .then(updateOrderResponse => {
      const { convertOrder } = require('@/utils/ADempiere/apiConverts/pos.js')

      return convertOrder(updateOrderResponse)
    })
}

// Get order from uuid
export function requestGetOrder(orderUuid) {
  return requestRest({
    url: '/pos/get-order',
    data: {
      order_uuid: orderUuid
    }
  })
    .then(evaluateResponse)
    .then(getOrderResponse => {
      const { convertOrder } = require('@/utils/ADempiere/apiConverts/pos.js')

      return convertOrder(getOrderResponse)
    })
}

// Create order from POS
export function requestDeleteOrder({
  orderUuid
  // posUuid,
  // customerUuid,
  // documentTypeUuid,
  // salesRepresentativeUuid
}) {
  return requestRest({
    url: '/pos/delete-order',
    data: {
      order_uuid: orderUuid
      // pos_uuid: posUuid,
      // customer_uuid: customerUuid,
      // document_type_uuid: documentTypeUuid,
      // sales_representative_uuid: salesRepresentativeUuid
    }
  })
    .then(evaluateResponse)
}

// List orders from pos uuid
export function requestListOrders({
  posUuid,
  documentNo,
  businessPartnerUuid,
  grandTotal,
  openAmount,
  isPaid,
  isProcessed,
  isAisleSeller,
  isInvoiced,
  // dateOrderedFrom,
  // dateOrderedTo,
  salesRepresentativeUuid,
  pageSize,
  pageToken
}) {
  /*
  const Criteria = require('@/utils/ADempiere/criteria.js')
  const criteria = new Criteria({
    tableName: 'C_Order'
  })

  criteria.addCondition({
    columnName: 'DocumentNo',
    value: documentNo
  }).addCondition({
    columnName: 'C_BPartner_ID_UUID',
    value: businessPartnerUuid
  }).addCondition({
    columnName: 'GrandTotal',
    value: grandTotal
  }).addCondition({
    columnName: 'OpenAmt',
    value: openAmount
  }).addCondition({
    columnName: 'IsPaid',
    value: isPaid
  }).addCondition({
    columnName: 'Processed',
    value: isProcessed
  }).addCondition({
    columnName: 'IsAisleSeller',
    value: isAisleSeller
  }).addCondition({
    columnName: 'IsInvoiced',
    value: isInvoiced
  }).addCondition({
    columnName: 'DateOrderedFrom',
    value: dateOrderedFrom
  }).addCondition({
    columnName: 'DateOrderedTo',
    value: dateOrderedTo
  }).addCondition({
    columnName: 'SalesRep_ID_UUID',
    value: salesRepresentativeId
  })
  */

  return requestRest({
    url: '/pos/list-orders',
    data: {
      pos_uuid: posUuid,
      document_no: documentNo,
      business_partner_uuid: businessPartnerUuid,
      sales_representative_uuid: salesRepresentativeUuid,
      grand_total: grandTotal,
      open_amount: openAmount,
      is_paid: isPaid,
      is_processed: isProcessed,
      is_aisle_seller: isAisleSeller,
      is_invoiced: isInvoiced
      // date_ordered_from: dateOrderedFrom,
      // date_ordered_to: dateOrderedTo
    },
    params: {
      page_size: pageSize,
      page_token: pageToken
    }
  })
    .then(evaluateResponse)
    .then(ordersListResponse => {
      const { convertOrder } = require('@/utils/ADempiere/apiConverts/pos.js')

      return {
        nextPageToken: ordersListResponse.next_page_token,
        recordCount: ordersListResponse.record_count,
        ordersList: ordersListResponse.records.map(productPrice => {
          return convertOrder(productPrice)
        })
      }
    })
}

// Create order line from order uuid and product
export function requestCreateOrderLine({
  orderUuid,
  warehouseUuid,
  productUuid,
  chargeUuid,
  description,
  quantity,
  price,
  discountRate
}) {
  return requestRest({
    url: '/pos/create-order-line',
    data: {
      order_uuid: orderUuid,
      product_uuid: productUuid,
      description,
      quantity,
      price,
      discount_rate: discountRate,
      charge_uuid: chargeUuid,
      warehouse_uuid: warehouseUuid
    }
  })
    .then(evaluateResponse)
    .then(createOrderLineResponse => {
      const { convertOrderLine } = require('@/utils/ADempiere/apiConverts/pos.js')

      return convertOrderLine(createOrderLineResponse)
    })
}

// updateOrderLine orders from pos uuid
export function requestUpdateOrderLine({
  orderLineUuid,
  description,
  quantity,
  price,
  discountRate
}) {
  return requestRest({
    url: '/pos/update-order-line',
    data: {
      // is_add_quantity: true,
      order_line_uuid: orderLineUuid,
      description,
      quantity,
      price,
      discount_rate: discountRate
    }
  })
    .then(evaluateResponse)
    .then(createOrderLineResponse => {
      const { convertOrderLine } = require('@/utils/ADempiere/apiConverts/pos.js')

      return convertOrderLine(createOrderLineResponse)
    })
}

// delete Order Line
export function requestDeleteOrderLine({
  orderLineUuid
}) {
  return requestRest({
    url: '/pos/delete-order-line',
    data: {
      order_line_uuid: orderLineUuid
    }
  })
    .then(evaluateResponse)
}

export function requestListOrderLines({
  orderUuid,
  pageSize,
  pageToken
}) {
  return requestRest({
    url: '/pos/list-order-lines',
    data: {
      order_uuid: orderUuid
    },
    params: {
      page_size: pageSize,
      page_token: pageToken
    }
  })
    .then(evaluateResponse)
    .then(ordersLineListResponse => {
      const { convertOrderLine } = require('@/utils/ADempiere/apiConverts/pos.js')

      return {
        nextPageToken: ordersLineListResponse.next_page_token,
        recordCount: ordersLineListResponse.record_count,
        orderLineList: ordersLineListResponse.records.map(productPrice => {
          return convertOrderLine(productPrice)
        })
      }
    })
}

export function getKeyLayout({ keyLayoutUuid }) {
  return requestRest({
    url: '/pos/get-key-layout',
    data: {
      key_layout_uuid: keyLayoutUuid
    }
  })
    .then(evaluateResponse)
    .then(keyLayoutResponse => {
      const { convertKeyLayout } = require('@/utils/ADempiere/apiConverts/pos.js')

      return convertKeyLayout(keyLayoutResponse)
    })
}

// ListProductPrice
export function requestListProductPrice({
  searchValue,
  priceListUuid,
  businessPartnerUuid,
  warehouseUuid,
  validFrom,
  // Query
  // criteria,
  pageSize,
  pageToken
}) {
  return requestRest({
    url: '/pos/list-product-prices',
    data: {
      price_list_uuid: priceListUuid,
      search_value: searchValue,
      valid_from: validFrom,
      business_partner_uuid: businessPartnerUuid,
      warehouse_uuid: warehouseUuid
    },
    params: {
      page_size: pageSize,
      page_token: pageToken
    }
  })
    .then(evaluateResponse)
    .then(productPriceListResponse => {
      const { convertProductPrice } = require('@/utils/ADempiere/apiConverts/core.js')

      return {
        nextPageToken: productPriceListResponse.next_page_token,
        recordCount: productPriceListResponse.record_count,
        productPricesList: productPriceListResponse.records.map(productPrice => {
          return convertProductPrice(productPrice)
        })
      }
    })
}

export function requestPrintOrder({
  orderUuid
}) {
  console.info(`Print order ${orderUuid}`)
}

export function requestGenerateImmediateInvoice({
  posId,
  posUuid
}) {
  console.info(`Generate imediate invoice with POS id ${posId}, and uuid ${posUuid}`)
}

export function requestCompletePreparedOrder({
  orderUuid
}) {
  console.info(`Complete prepared order ${orderUuid}`)
}

export function requestReverseSalesTransaction({
  orderUuid
}) {
  console.info(`Reverse sales transaction ${orderUuid}`)
}

export function requestCreateWithdrawal({
  posId,
  posUuid
}) {
  console.info(`Withdrall cash with POS id ${posId}, and uuid ${posUuid}`)
}

export function requestCreateNewCustomerReturnOrder({
  orderUuid
}) {
  console.info(`New Customer Return Order ${orderUuid}`)
}

export function requestCashClosing({
  posId,
  posUuid
}) {
  console.info(`Cash closing with POS id ${posId}, and uuid ${posUuid}`)
}

// Create Payment

export function requestCreatePayment({
  posUuid,
  orderUuid,
  invoiceUuid,
  bankUuid,
  referenceNo,
  description,
  amount,
  paymentDate,
  tenderTypeCode,
  currencyUuid
}) {
  return requestRest({
    url: '/pos/create-payment',
    data: {
      pos_uuid: posUuid,
      order_uuid: orderUuid,
      invoice_uuid: invoiceUuid,
      bank_uuid: bankUuid,
      reference_no: referenceNo,
      description: description,
      amount: amount,
      payment_date: paymentDate,
      tender_type_code: tenderTypeCode,
      currency_uuid: currencyUuid
    }
  })
    .then(evaluateResponse)
    .then(createPaymentResponse => {
      return createPaymentResponse
    })
}

// Update Payment

export function requestUpdatePayment({
  paymentUuid,
  bankUuid,
  referenceNo,
  description,
  amount,
  paymentDate,
  tenderTypeCode
}) {
  return requestRest({
    url: '/pos/update-payment',
    data: {
      payment_uuid: paymentUuid,
      bank_uuid: bankUuid,
      reference_no: referenceNo,
      description: description,
      amount: amount,
      payment_date: paymentDate,
      tender_type_code: tenderTypeCode
    }
  })
    .then(evaluateResponse)
    .then(updatePaymentResponse => {
      return updatePaymentResponse
    })
}

// Delete Payment

export function requestDeletePayment({
  paymentUuid
}) {
  return requestRest({
    url: '/pos/delete-payment',
    data: {
      payment_uuid: paymentUuid
    }
  })
    .then(evaluateResponse)
    .then(deletePaymentResponse => {
      return deletePaymentResponse
    })
}

// List Payments

export function requestListPayments({
  posUuid,
  orderUuid
}) {
  return requestRest({
    url: '/pos/list-payments',
    data: {
      pos_uuid: posUuid,
      order_uuid: orderUuid
    }
  })
    .then(evaluateResponse)
    .then(listPaymentsResponse => {
      const { paymentsMethod } = require('@/utils/ADempiere/apiConverts/pos.js')
      return {
        nextPageToken: listPaymentsResponse.next_page_token,
        recordCount: listPaymentsResponse.record_count,
        listPayments: listPaymentsResponse.records.map(payments => {
          return paymentsMethod(payments)
        })
      }
    })
}

/**
 * Process Order
 * This request allows process a draft order with payments
 *
 * req.query.token - user token
 * Body:
 * req.body.pos_uuid - POS UUID reference
 * req.body.order_uuid - Order UUID reference
 * req.body.create_payments - Optional create payments (if is true then hope payments array)
 * req.body.payments
 * [
 * invoice_uuid - Invoice UUID reference
 * bank_uuid - Bank UUID reference
 * reference_no - Reference no
 * description - Description for Payment
 * amount - Payment Amount
 * tender_type_code - Tender Type
 * payment_date - Payment Date (default now)
 * currency_uuid - Currency UUID reference
 * ]
 */
export function requestProcessOrder({
  posUuid,
  orderUuid,
  createPayments,
  payments
}) {
  if (!isEmptyValue(payments)) {
    payments = payments.map(parameter => {
      return {
        invoice_uuid: parameter.invoiceUuid,
        bank_uuid: parameter.bankUuid,
        reference_no: parameter.referenceNo,
        description: parameter.description,
        amount: parameter.amount,
        tender_type_code: parameter.tenderTypeCode,
        payment_ate: parameter.paymentDate,
        currency_uid: parameter.currencyUuid
      }
    })
  }
  return requestRest({
    url: '/pos/process-order',
    data: {
      pos_uuid: posUuid,
      order_uuid: orderUuid,
      create_payments: createPayments,
      payments: payments
    }
  })
    .then(evaluateResponse)
    .then(processOrderResponse => {
      return processOrderResponse
    })
}
