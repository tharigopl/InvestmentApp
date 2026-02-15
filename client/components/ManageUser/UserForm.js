import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import Input from './Input';
import Button from '../ui/Button';
import { getFormattedDate } from '../../util/date';
import { GlobalStyles } from '../../constants/styles';
import { ScrollView } from 'react-native-gesture-handler';

function UserForm({ submitButtonLabel, onCancel, onSubmit, defaultValues }){
    console.log("User Date Received ", defaultValues);
    const [inputs, setInputs] = useState({
        fname: {
          value: defaultValues ? defaultValues.fname : '',
          isValid: true,
        },
        mname: {
            value: defaultValues ? defaultValues.mname : '',
            isValid: true,
          },
        lname: {
          value: defaultValues ? defaultValues.lname : '',
          isValid: true,
        },
        dateofbirth: {
          value: defaultValues ? defaultValues.dateofbirth : '',
          isValid: true,
        },
        cntrytaxresidence: {
            value: defaultValues ? defaultValues.cntrytaxresidence : '',
            isValid: true,
        },
        fundingsource: {
            value: defaultValues ? defaultValues.fundingsource : '',
            isValid: true,
        },
        email: {
            value: defaultValues ? defaultValues.email : '',
            isValid: true,
        },
        phoneno: {
            value: defaultValues ? defaultValues.phoneno : '',
            isValid: true,
        },
        street: {
            value: defaultValues ? defaultValues.street : '',
            isValid: true,
        },
        unit: {
            value: defaultValues ? defaultValues.unit : '',
            isValid: true,
        },
        city: {
            value: defaultValues ? defaultValues.city : '',
            isValid: true,
        },
        state: {
            value: defaultValues ? defaultValues.state : '',
            isValid: true,
        },
        postalcode: {
            value: defaultValues ? defaultValues.postalcode : '',
            isValid: true,
        },
        country: {
            value: defaultValues ? defaultValues.country : '',
            isValid: true,
        },
      });

      function inputChangedHandler(inputIdentifier, enteredValue) {
        setInputs((curInputs) => {
          return {
            ...curInputs,
            [inputIdentifier]: { value: enteredValue, isValid: true },
          };
        });
      }
    
      function submitHandler() {
        const userData = {
            fname:inputs.fname.value,
            lname:inputs.lname.value,
            mname:inputs.mname.value,
            email:inputs.email.value,
            unit:inputs.unit.value,
            street:inputs.street.value,
            phoneno:inputs.phoneno.value,
            fundingsource:inputs.fundingsource.value,
            cntrytaxresidence:inputs.cntrytaxresidence.value,
            dateofbirth:inputs.dateofbirth.value,
            city:inputs.city.value,
            state:inputs.state.value,
            postalcode:inputs.postalcode.value,
            country:inputs.country.value,
        };
        console.log("User Form Submit", userData);
        const fnameIsValid = userData.fname.length > 0;
        const lnameIsValid = userData.lname.length > 0;
        const mnameIsValid = userData.mname.length > 0;
        const emailIsValid = userData.email.length > 0;
        const unitIsValid = userData.unit.length > 0;
        const streetIsValid = userData.street.length > 0;
        const phonenoIsValid = userData.phoneno.length > 0;
        //const fundingsourceIsValid = userData.fundingsource.length > 0;
        //const cntrytaxresidenceIsValid = userData.cntrytaxresidence.length > 0;
        const dateofbirthIsValid = userData.dateofbirth.length > 0;
        const cityIsValid = userData.city.length > 0;
        const stateIsValid = userData.state.length > 0;
        const postalcodeIsValid = userData.postalcode.length > 0;
        const countryIsValid = userData.country.length > 0;
        console.log("User Form Submit 1", userData);
        //|| !fundingsourceIsValid || !cntrytaxresidenceIsValid 
        if (!fnameIsValid || !lnameIsValid || !mnameIsValid || !emailIsValid || !unitIsValid ||
            !streetIsValid || !phonenoIsValid || !dateofbirthIsValid ||
            !cityIsValid || !stateIsValid || !postalcodeIsValid || !countryIsValid) {
          console.log('Invalid input', 'Please check your input values');
          setInputs((curInputs) => {
            return {

                fname: {value:curInputs.fname.value, isValid: fnameIsValid},
                lname: {value:curInputs.lname.value, isValid: lnameIsValid},
                mname: {value:curInputs.mname.value, isValid: mnameIsValid},
                email: {value:curInputs.email.value, isValid: emailIsValid},
                unit: {value:curInputs.unit.value, isValid: unitIsValid},
                street: {value:curInputs.street.value, isValid: streetIsValid},
                phoneno: {value:curInputs.phoneno.value, isValid: phonenoIsValid},
                //fundingsource: {value:curInputs.fundingsource.value, isValid: fundingsourceIsValid},
                //cntrytaxresidence: {value:curInputs.cntrytaxresidence.value, isValid: cntrytaxresidenceIsValid},
                dateofbirth: {value:curInputs.dateofbirth.value, isValid: dateofbirthIsValid},
                city: {value:curInputs.city.value, isValid: cityIsValid},
                state: {value:curInputs.state.value, isValid: stateIsValid},
                postalcode: {value:curInputs.postalcode.value, isValid: postalcodeIsValid},
                country: {value:curInputs.country.value, isValid: countryIsValid},
            };
          });
          return;
        }
        console.log("before submit");
        onSubmit(userData);
      }
    
      const formIsInvalid = !inputs.fname.isValid || !inputs.lname.isValid || !inputs.mname.isValid || !inputs.email.isValid ||
      !inputs.unit.isValid || !inputs.street.isValid || !inputs.phoneno.isValid || !inputs.fundingsource.isValid || !inputs.cntrytaxresidence.isValid ||
      !inputs.dateofbirth.isValid || !inputs.city.isValid || !inputs.state.isValid || !inputs.postalcode.isValid || !inputs.country.isValid;

    return(
        <ScrollView style={styles.scroll}>
        <View style={styles.form}>
            <Text style={styles.title}>User Details</Text>
            <View>
                <Input
                label="First Name"
                invalid={!inputs.fname.isValid}
                textInputConfig={{
                    onChangeText: inputChangedHandler.bind(this, 'fname'),
                    value: inputs.fname.value,
                }}
                />
                <Input
                label="Middle Name"
                invalid={!inputs.mname.isValid}
                textInputConfig={{
                    onChangeText: inputChangedHandler.bind(this, 'mname'),
                    value: inputs.mname.value,
                }}
                />
                <Input
                label="Last Name"
                invalid={!inputs.lname.isValid}
                textInputConfig={{
                    onChangeText: inputChangedHandler.bind(this, 'lname'),
                    value: inputs.lname.value,
                }}
                />
                <Input
                label="Date of Birth"
                invalid={!inputs.dateofbirth.isValid}
                textInputConfig={{
                    onChangeText: inputChangedHandler.bind(this, 'dateofbirth'),
                    value: inputs.dateofbirth.value,
                }}
                />
                {/* <Input
                label="Country of tax residence"
                invalid={!inputs.cntrytaxresidence.isValid}
                textInputConfig={{
                    onChangeText: inputChangedHandler.bind(this, 'cntrytaxresidence'),
                    value: inputs.cntrytaxresidence.value,
                }}
                />
                <Input
                label="Funding Source"
                invalid={!inputs.fundingsource.isValid}
                textInputConfig={{
                    onChangeText: inputChangedHandler.bind(this, 'fundingsource'),
                    value: inputs.fundingsource.value,
                }}
                /> */}
                <Input
                    label="Email"
                    invalid={!inputs.email.isValid}
                    textInputConfig={{
                    // autoCapitalize: 'none'
                    // autoCorrect: false // default is true
                    onChangeText: inputChangedHandler.bind(this, 'email'),
                    value: inputs.email.value,
                    }}
                />
                <Input
                    label="Phone No"
                    invalid={!inputs.phoneno.isValid}
                    textInputConfig={{
                    // autoCapitalize: 'none'
                    // autoCorrect: false // default is true
                    onChangeText: inputChangedHandler.bind(this, 'phoneno'),
                    value: inputs.phoneno.value,
                    }}
                />
                <Input
                    label="Street"
                    invalid={!inputs.street.isValid}
                    textInputConfig={{
                    // autoCapitalize: 'none'
                    // autoCorrect: false // default is true
                    onChangeText: inputChangedHandler.bind(this, 'street'),
                    value: inputs.street.value,
                    }}
                />
                <Input
                    label="Unit"
                    invalid={!inputs.unit.isValid}
                    textInputConfig={{
                    // autoCapitalize: 'none'
                    // autoCorrect: false // default is true
                    onChangeText: inputChangedHandler.bind(this, 'unit'),
                    value: inputs.unit.value,
                    }}
                />
                <Input
                    label="City"
                    invalid={!inputs.city.isValid}
                    textInputConfig={{
                    // autoCapitalize: 'none'
                    // autoCorrect: false // default is true
                    onChangeText: inputChangedHandler.bind(this, 'city'),
                    value: inputs.city.value,
                    }}
                />
                <Input
                    label="State"
                    invalid={!inputs.state.isValid}
                    textInputConfig={{
                    // autoCapitalize: 'none'
                    // autoCorrect: false // default is true
                    onChangeText: inputChangedHandler.bind(this, 'state'),
                    value: inputs.state.value,
                    }}
                />
                <Input
                    label="Postal Code"
                    invalid={!inputs.postalcode.isValid}
                    textInputConfig={{
                    // autoCapitalize: 'none'
                    // autoCorrect: false // default is true
                    onChangeText: inputChangedHandler.bind(this, 'postalcode'),
                    value: inputs.postalcode.value,
                    }}
                />
                <Input
                    label="Country"
                    invalid={!inputs.country.isValid}
                    textInputConfig={{
                    // autoCapitalize: 'none'
                    // autoCorrect: false // default is true
                    onChangeText: inputChangedHandler.bind(this, 'country'),
                    value: inputs.country.value,
                    }}
                />
            </View>        
            {formIsInvalid && (
                <Text style={styles.errorText}>
                Invalid input values - please check your entered data!
                </Text>
            )}
            <View style={styles.buttons}>
                <Button style={styles.button} mode="flat" onPress={onCancel}>
                Cancel
                </Button>
                <Button style={styles.button} onPress={submitHandler}>
                {submitButtonLabel}
                </Button>
            </View>
        </View>
        </ScrollView>
    );
}

export default UserForm;

const styles = StyleSheet.create({
    form: {
      marginTop: 10,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: 'white',
      marginVertical: 0,
      textAlign: 'center',
    },
    inputsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    rowInput: {
      flex: 1,
    },
    errorText: {
      textAlign: 'center',
      color: GlobalStyles.colors.error500,
      margin: 8,
    },
    buttons: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    button: {
      minWidth: 120,
      marginHorizontal: 8,
    },
    scroll: {
        backgroundColor: '#FFF',
      },
  });