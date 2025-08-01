import { LightningElement, wire, api } from "lwc";
import { MessageContext, publish } from "lightning/messageService";

import BOATMC from "@salesforce/messageChannel/BoatMessageChannel__c";
import getBoats from "@salesforce/apex/BoatDataService.getBoats";
import updateBoatList from "@salesforce/apex/BoatDataService.updateBoatList";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { refreshApex } from "@salesforce/apex";

const SUCCESS_TITLE = "Success";
const MESSAGE_SHIP_IT = "Ship it!";
const SUCCESS_VARIANT = "success";
const ERROR_TITLE = "Error";
const ERROR_VARIANT = "error";

const BOAT_COLUMNS = [
  { label: "Name", fieldName: "Name", editable: true },
  { label: "Length", fieldName: "Length__c", editable: true },
  { label: "Price", fieldName: "Price__c", type: "currency", editable: true },
  { label: "Description", fieldName: "Description__c", editable: true }
];

export default class BoatSearchResults extends LightningElement {
  @api selectedBoatId;
  columns = [];
  boatTypeId = "";
  boats;
  isLoading = false;
  draftValues = [];

  // wired message context
  @wire(MessageContext)
  messageContext;

  // wired getBoats method
  @wire(getBoats, { boatTypeId: "$boatTypeId" })
  wiredBoats({ data, error }) {
    if (data) {
      this.boats = data;
      this.columns = BOAT_COLUMNS;
    } else if (error) {
      console.log("data.error");
      console.log(error);
    }
  }

  // public function that updates the existing boatTypeId property
  // uses notifyLoading
  @api searchBoats(boatTypeId) {
    this.isLoading = true;
    this.notifyLoading(this.isLoading);
    this.boatTypeId = boatTypeId;
    this.isLoading = false;
    this.notifyLoading(this.isLoading);
  }

  // this public function must refresh the boats asynchronously
  // uses notifyLoading
  async refresh() {
    this.isLoading = true;
    this.notifyLoading(this.isLoading);
    await refreshApex(this.boats);
    this.isLoading = false;
    this.notifyLoading(this.isLoading);
  }

  // this function must update selectedBoatId and call sendMessageService
  updateSelectedTile(event) {
    this.selectedBoatId = event.detail.boatId;
    this.sendMessageService(this.selectedBoatId);
  }

  // Publishes the selected boat Id on the BoatMC.
  sendMessageService(boatId) {
    // explicitly pass boatId to the parameter recordId
    this.selectedBoatId = boatId;
    const payload = {
      recordId: this.selectedBoatId
    };
    // publish the message
    publish(this.messageContext, BOATMC, payload);
  }

  // The handleSave method must save the changes in the Boat Editor
  // passing the updated fields from draftValues to the
  // Apex method updateBoatList(Object data).
  // Show a toast message with the title
  // clear lightning-datatable draft values
  handleSave(event) {
    // notify loading
    const updatedFields = event.detail.draftValues;
    // Update the records via Apex

    updateBoatList({ data: updatedFields })
      .then((result) => {
        this.dispatchEvent(
          new ShowToastEvent({
            title: SUCCESS_TITLE,
            message: MESSAGE_SHIP_IT,
            variant: SUCCESS_VARIANT
          })
        );
        this.draftValues = [];
      })
      .catch((error) => {
        this.dispatchEvent(
          new ShowToastEvent({
            title: ERROR_TITLE,
            message: error.body.message,
            variant: ERROR_VARIANT
          })
        );
      })
      .finally(() => {
        this.refresh();
      });
  }
  // Check the current value of isLoading before dispatching the doneloading or loading custom event
  notifyLoading(isLoading) {
    if (isLoading) {
      this.dispatchEvent(new CustomEvent("loading"));
    } else {
      this.dispatchEvent(new CustomEvent("doneLoading"));
    }
  }
}
