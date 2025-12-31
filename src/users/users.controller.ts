import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dtos/createuser.dto';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { LoginUserDto } from './dtos/loginuser.dto';
import { AuthGuard } from './auth.guard';

@Controller('users')
export class UsersController {
    constructor(private readonly userService: UsersService) { }
    @ApiOperation({ summary: "user registration", description: "register user" })
    @Post('register')
    @ApiResponse({ status: 201, description: "user created successfully" })
    @ApiResponse({ status: 400, description: "Invalid Input data" })
    @UsePipes(ValidationPipe)
    register(@Body() createUserDto: CreateUserDto) {
        return this.userService.register(createUserDto);
    }

    @ApiOperation({ summary: "Email verification", description: "Verify user's email using token" })
    @ApiQuery({ name: 'token', required: true, description: 'verification token' })
    @ApiResponse({ status: 200, description: "Email verified" })
    @ApiResponse({ status: 400, description: "Token expired" })
    @ApiResponse({ status: 404, description: "Invalid token" })
    @Get('verify')
    async verify(@Query('token') token: string) {
        //  console.log('verify endpoint hit, token=', token);
        return this.userService.verifyEmail(token);
    }

    @ApiBearerAuth()
    @ApiOperation({ summary: "Get Loggin User Details", description: "Fetch detail" })
    @ApiParam({ name: "id", description: 'user id', type: Number })
    @ApiResponse({ status: 200, description: "user found" })
    @ApiResponse({ status: 404, description: "user not found" })
    @UseGuards(AuthGuard)
    @Get(":id")
    getUserById(@Param('id', ParseIntPipe) id: number) {
        return this.userService.findUserById(id)
    }


    @ApiOperation({ summary: "Login", description: "User login" })
    @Post('login')
    @ApiResponse({ status: 201, description: "user login successfully" })
    @ApiResponse({ status: 401, description: "Invalid Input data" })
    async login(@Body() loginData: LoginUserDto) {
        return this.userService.login(loginData)
    }
    
}
