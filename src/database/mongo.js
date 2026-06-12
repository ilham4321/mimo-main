import mongoose from 'mongoose';
import chalk from 'chalk';

const connectDB = async (url) => {
    try {
        await mongoose.connect(url);
        console.log(chalk.green.bold('✅ MongoDB Connected Successfully!'));
    } catch (error) {
        console.error(chalk.red.bold('❌ MongoDB Connection Failed: '), error);
        process.exit(1);
    }
};

export default connectDB;
