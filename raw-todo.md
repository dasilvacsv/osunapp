ok so the system overall will have now
- Paquetes handling
i want a way i can make the paquetes show like, yea on el cardier we sold 20 paquetes con estola amrilla, and 
show each benefficiary, in this case when selecting client, select who is going the package to, if it doesnt 
have the Beneficiario field with ApellidosBeneficiario, NombresBeneficiario, it will ask for it, this is kind 
of the "children" creation when the client is parent but i think ill remove that just create clients and we 
create or se any table that hold s the info from the beneficiario such as -Apellidos, Nombres, Colegio => 
foreign key to colegio, Nivel, Seccion

- We will have the reconocimientos function that we will pass for example: Cardier: it will pass the list of 
beneficiarios and it will say who has the pending APELLIDOS Y NOMBRES or beneficiario info, those users will 
be highlited in red in tables and will be given an status of incomplete 
- On organization we will have now the fields of (Privada, Publica like this will be naturaleza or a good word 
for it idk), we will add a city field and we will have a table of cities where we can create if not available 
tho we will have some initial ones, also we will have on organization a way could be a table of sections, in 
this case will be name of section, and the templateLink, in this case will be like: Organization => section 
(level whatever ) they can be highschool, school, prescholar, university, so they will say kinda, 
Organization: {level: Preescolar, templateLink: x, level: 5TO Año, templateLink: x } so it will be scalable 
with any org not limited just for schools could be enterprise too because this will be used by the 
reconocimientos thing that will handle it, and of course we will dropdown organizations to see its sections 
and if they have missing templaes

- Add metrics on top to organization that could help

- Track pending payments, we can create sales that are not paid yet so we can track it
- On sales we need a param that we can select, direct sale, Pre-sale (will select package, client, and set 
status not paid) and we will autocreate the installments like depending on default frecuency so people can pay 
according, we need the payments table too where we can add payments for a sale and it will render it so we 
will know pending

- on Sales we will have a popover select with add item so we can create the client if is not there with the 
required fields and it will make flow faster
- On bundles we can have global packages as we can have package created for orgs (we will reference it with id 
of Org)
- Use PopoverSelect for category of creation of Package
- Enhance the usage of category, in this case we will have the category that will work to know, ok all the 
packages from preescolar, thats the usage, and we on creating bundle will say basic package of preescolar
- On inventory items we will add a button to add or remove inventory, with a reason and it will be recorded on 
the history of inventory of an item
- We will create a section to register purchases, in this case we can directly put here, select from created 
items load items, quantity and updated price, also would be good to handle pricing according to the according 
stock ,like if we got 100 hats at 5$ then we sold 90 and a new stock of 40 comes at 6$, it will autoavg the 
cost price
- Inventory set margin, from cost Price or manual
- Make the inventory table with pagination and more
- Render on top a graph with top sold items
- Render properly the items that needs restock
- We will add a "Proyeccion Field" where we can put kinda a limit of items liek i say yeah we need 1000 and 
according to sales if this exceed number we notice, as the presales will "sell" the item, it will discount 
from inventory but we need to do fancy logic here
- Delete Paquetes
- Delete items from inventroy (or disable better => soft delete items)
- We can on creation of packages, bring the items used by other package and info so we can quickly create a 
variation of other package
- On package creation we need to change it to come by default with sale price of inventory, and yeah the field 
being editable so people can input other price, also we need to put yeah this on cost price costs X with the 
items selected , and with the sale price the margin of this package is X
- Make the delete button on package items selected properly

- I want a way that ok we create the package sales but they get listed in another module so we can see how 
many packages we sold on each organization, the amount of each one, and list the people, this will be a complx 
join query but will be a killer feature

- I want a way that ok we create the package sales but they get listed in another module so we can see how 
many packages we sold on each organization, the amount of each one, and list the people, this will be a complx 
join query but will be a killer feature

 Make that package if Pre-Sale selected on top we can sell it no need to have stock

 - On create new sale we will have popover select for client where we can find using the Cedula / Name, and it 
will bring in gray the user, organization where he belongs etc
