class User {
    constructor(
      id,
      fname,
      mname,
      lname,
      email,
      phoneno,
      street,
      unit,
      city,
      state,
      postalcode,
      country,
      dateofbirth,
      cntrytaxresidence,
      fundingsource,

    ) {
      this.id = id;
      this.fname = fname;
      this.lname = lname;
      this.email = email;
      this.phoneno = phoneno;
      this.street = street;
      this.unit = unit;
      this.city = city;
      this.country = country;
      this.state = state;
      this.postalcode = postalcode;
      this.dateofbirth = dateofbirth;
      this.cntrytaxresidence = cntrytaxresidence;
      this.fundingsource=fundingsource;
      this.mname = mname;
    }
  }
  
  export default User;
  