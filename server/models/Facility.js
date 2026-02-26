import mongoose from 'mongoose';

const PINCODE_REGEX = /^\d{6}$/;
const PHONE_REGEX = /^\d{10}$/;

const facilitySchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        type: {
            type: String,
            required: true,
            enum: ['Hospital', 'Blood Bank', 'PHC'],
            index: true,
        },
        pincode: {
            type: String,
            required: true,
            index: true,
            validate: {
                validator: (value) => PINCODE_REGEX.test(value),
                message: 'pincode must be exactly 6 digits.',
            },
        },
        contactNumber: {
            type: String,
            required: true,
            validate: {
                validator: (value) => PHONE_REGEX.test(value),
                message: 'contactNumber must be exactly 10 digits.',
            },
        },
        // Optional geospatial metadata for future nearest-distance resolution.
        location: {
            type: {
                type: String,
                enum: ['Point'],
            },
            coordinates: {
                type: [Number],
                validate: {
                    validator: (value) => value == null || value.length === 2,
                    message: 'location.coordinates must contain [lng, lat].',
                },
            },
        },
    },
    { timestamps: true }
);

facilitySchema.index({ location: '2dsphere' });
facilitySchema.index({ name: 'text', type: 'text', pincode: 'text' });
facilitySchema.index({ pincode: 1, type: 1 });

export default mongoose.model('Facility', facilitySchema);
