import mongoose from 'mongoose';

const HospitalSchema = new mongoose.Schema({
     hospital: {
          type: String,
          required: true
     },
     city: {
          type: String,
          required: true
     },
     address: {
          type: String,
          required: true
     }
});

export default mongoose.model('Hospital', HospitalSchema);