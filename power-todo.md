- Make register Bs Payment => Exchange rate convert to dollars like

- When we select Bs on venta as the currencyType of Sale will be the main, so when we paying and it asks for other currency, we select and it would check like this:
if paymentCurrency ≠ currencyType of sale it will show exchange rate so by default if it is a Dollar sale when selecting bs it will say:
input bs amount  show the input of currencyExchangeRate with default amount of BCV and say this is X amount of dollar so in the end it will say ok this is X amount of dollars and abonar
On bs sales just let it pay in Bs, so it wont be able to select currency nor currencyExchange, it will just abonar, this will work as normally works normal payments because in the end the currency is just a symbol so when currencyType is BS it will be normal it is 1000Bs, your abono is 100 900 Left

- Mark as vendido, make a special easter egg to trigger it could work a key combination such as CTRl + B + 6 it will trigger a dialog with a button to do and wont say nothing of vendido or whatever, it will ask for a code we will hardcode like 1234 to mark as vendido (this is simple just make the actual switch be hidden and invoked with a keystroke)

- Donacion param will be something like the preventa one, it will just go and wont show reference or something because is just like preventa, the thing this will only show to user where role is == ADMIN

- Make the products inside sale detail [id] properly show the price

- Donacion => if donacion it will go by default on draft and will be marked with pending approval, the approval needs to be given by admin

- Make the borradors table properly render sales where status is borrador, rn it doesn't

- Paquetes => add currency type to paquetes, and make Bs paquetes, this way when selecting in ventas that is in Bs, the paquete will also come in Bs, if you find a better way to do this is good too, a good option might be setting the exchange rate but has to be the custom exchange rate so it is equal paquete$ amount x tasa will be 1400Bs could be the best option

- Bs sales will only allow paquetes that are set in Bs, or we could just do a custom exchange rate for this so it will multiply it and get the amount we want, idk find the best and optimal option that dont break everything and make us headache

- Abonar, if total Amount vs Paid Amount status, it will auto purge the payments pending on db will delete those cuotas pending because it was paid fully with an abono, and we will set the sale as paid

- Make on Cierre show each payment thats rendered for the day is a select from * payments join sales and show the sale link to go just as it does on Inventory
