import dbConnection, { tableNames, execute } from '../connection';

import * as R from 'ramda';

const peopleTable = () => dbConnection()(tableNames.PEOPLE);
const peopleAttributesTable = () => dbConnection()(tableNames.PEOPLE_ATTRIBUTES);

/**
 * Represents a person in the database
 */
interface PersonDb {
  personuuid: string;
  peoplecategoryid: number;
  peoplecategoryname: string;
  firstname: string;
  middlename: string;
  lastname: string;
  phonenumber: string;
  phonearea: string;
  phonecountry: string;
  companyname: string;
  lastmodified: string;
}

/**
 * Represents a person attribute in the database
 */
interface PeopleAttributeDb {
  personuuid: string;
  attrname: string;
  attrvalue: string;
}

/**
 * Represents a person returned in the API
 */
interface Person {
  uuid: string;
  peopleCategory: string;
  firstName: string;
  middleName: string;
  lastName: string;
  phoneNumber: string;
  phoneArea: string;
  phoneCountry: string;
  companyName: string;
  lastModified: string;

  username?: string;
  paymentFrequency?: string;
  notes?: string;
}

const builders = {
  /** Get all people of a certain type */
  getPeople(peoplecategoryname: string) {
    return peopleTable().select('*')
    .join(tableNames.PEOPLE_CATEGORIES,
      tableNames.PEOPLE + '.peoplecategoryid',
      tableNames.PEOPLE_CATEGORIES + '.peoplecategoryid')
    .where({ peoplecategoryname });
  },

  /** get all attributes and their values for people of a certain type */
  getPeopleAttributeValues(peoplecategoryname: string) {
    return peopleAttributesTable().select('personuuid', 'attrname', 'attrvalue')
    .join(tableNames.PEOPLE_ATTRIBUTE_TYPES,
        tableNames.PEOPLE_ATTRIBUTES + '.attrid',
        tableNames.PEOPLE_ATTRIBUTE_TYPES + '.attrid')
    .join(tableNames.PEOPLE_CATEGORY_ATTRIBUTES,
        tableNames.PEOPLE_ATTRIBUTE_TYPES + '.attrid',
        tableNames.PEOPLE_CATEGORY_ATTRIBUTES + '.attrid')
    .join(tableNames.PEOPLE_CATEGORIES,
        tableNames.PEOPLE_CATEGORIES + '.peoplecategoryid',
        tableNames.PEOPLE_CATEGORY_ATTRIBUTES + '.peoplecategoryid')
    .where({ peoplecategoryname });
  },
};

/** Get all people of a certain category */
export async function getPeople(personCategory: string): Promise<Person[]> {
  const people = await execute<PersonDb[]>(builders.getPeople(personCategory));
  const attrValues = await execute<PeopleAttributeDb[]>(builders.getPeopleAttributeValues(personCategory));
  const results : Person[] = [];

  people.forEach(function (item) {
    const isMatchingUuid = R.propEq('personuuid', item.personuuid);

    const isNotesAttr = R.propEq('attrname', 'notes');
    const notesAttr = R.find(R.allPass([isMatchingUuid, isNotesAttr]))(attrValues);

    const isPaymentFrequencyAttr = R.propEq('attrname', 'paymentFrequency');
    const paymentFrequencyAttr = R.find(R.allPass([isMatchingUuid, isPaymentFrequencyAttr]))(attrValues);

    const isUsernameAttr = R.propEq('attrname', 'username');
    const usernameAttr = R.find(R.allPass([isMatchingUuid, isUsernameAttr]))(attrValues);

    const person : Person = {
      uuid: item.personuuid,
      peopleCategory: item.peoplecategoryname,
      firstName: item.firstname,
      middleName: item.middlename,
      lastName: item.lastname,
      phoneNumber: item.phonenumber,
      phoneArea: item.phonearea,
      phoneCountry: item.phonecountry,
      companyName: item.companyname,
      lastModified: item.lastmodified,
    };

    if (notesAttr) {
      person.notes = notesAttr.attrvalue;
    }
    if (paymentFrequencyAttr) {
      person.paymentFrequency = paymentFrequencyAttr.attrvalue;
    }
    if (usernameAttr) {
      person.username = usernameAttr.attrvalue;
    }

    results.push(person);
  });
  return results;
}
