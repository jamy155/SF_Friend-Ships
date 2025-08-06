import { LightningElement } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';

export default class BoatSearch extends NavigationMixin(LightningElement) {

    isLoading = false;

  // Handles loading event
    handleLoading() {
        this.isLoading = true;
        console.log("Parent: Loading started");
     }

  // Handles done loading event
    handleDoneLoading() {
        this.isLoading = false;
        console.log("Parent: Loading ended");
     }

  // Handles search boat event
  // This custom event comes from the form
    searchBoats(event) { 
        let boatTypeId = event.detail.boatTypeId;
        this.template.querySelector('c-boat-search-results').searchBoats(boatTypeId);
        this.handleDoneLoading();
    }

    createNewBoat() { 
        this[NavigationMixin.Navigate]({
            type: 'standard__objectPage',
            attributes: {
                objectApiName: 'Boat__c',
                actionName: 'new'
            }
        });
    }
}