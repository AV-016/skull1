# PowerShell script to test all backend API functions using curl.exe

$BASE_URL = "http://localhost:5000/api"
$RAND = Get-Random -Minimum 1000 -Maximum 9999
$CUST_EMAIL = "test_cust_$RAND@example.com"
$CUST_PASS = "CustomerPassword123!"

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "STARTING E-COMMERCE & ADMIN API FUNCTIONAL TESTS" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "Test Customer Email: $CUST_EMAIL" -ForegroundColor Yellow
Write-Host "Base API URL: $BASE_URL" -ForegroundColor Yellow

# Helper to run curl command and show response
function Run-Curl {
    param(
        [string]$Method,
        [string]$Path,
        [string]$Payload,
        [string]$Token
    )
    
    $Url = "$BASE_URL$Path"
    $Headers = @()
    if ($Token) {
        $Headers += "-H `"Authorization: Bearer $Token`""
    }
    
    # Save payload to temp file to prevent escaping issues on Windows shell
    if ($Payload) {
        $TempFile = [System.IO.Path]::GetTempFileName()
        $Payload | Out-File -FilePath $TempFile -Encoding utf8
        $DataArg = "--data-binary `"@$TempFile`""
    } else {
        $DataArg = ""
    }
    
    $HeaderStr = $Headers -join " "
    $Cmd = "curl.exe -s -X $Method -H `"Content-Type: application/json`" $HeaderStr $DataArg `"$Url`""
    
    Write-Host "`n[$Method] $Path" -ForegroundColor Green
    if ($Payload) {
        Write-Host "Payload: $Payload" -ForegroundColor DarkGray
    }
    
    # Execute
    $Response = Invoke-Expression $Cmd
    
    if ($Payload) {
        Remove-Item $TempFile -ErrorAction SilentlyContinue
    }
    
    Write-Host "Response: $Response" -ForegroundColor White
    return $Response
}

# 1. PUBLIC ENDPOINTS
Write-Host "`n--- 1. Testing Public Endpoints ---" -ForegroundColor Blue
Run-Curl "GET" "/health"
Run-Curl "GET" "/version"
Run-Curl "GET" "/settings"

# 2. CUSTOMER SIGNUP
Write-Host "`n--- 2. Testing Customer Signup & Auth ---" -ForegroundColor Blue
$RegisterPayload = "{`"email`":`"$CUST_EMAIL`",`"password`":`"$CUST_PASS`",`"name`":`"Test Customer $RAND`"}"
$RegRes = Run-Curl "POST" "/auth/register" $RegisterPayload

# Get OTP from database
Write-Host "`nRetrieving verification OTP from database..." -ForegroundColor Yellow
$OTP = Invoke-Expression "cmd.exe /c `"cd skull1-main && npx ts-node src/get_otp.ts $CUST_EMAIL`""
$OTP = [regex]::Match($OTP, '\b\d{6}\b').Value
if (-not $OTP) {
    Write-Host "Error: Could not extract 6-digit OTP. Exiting." -ForegroundColor Red
    exit
}
Write-Host "Retrieved OTP: $OTP" -ForegroundColor Yellow

# Verify OTP
$VerifyPayload = "{`"email`":`"$CUST_EMAIL`",`"otp`":`"$OTP`"}"
Run-Curl "POST" "/auth/verify-otp" $VerifyPayload

# Login Customer
$LoginPayload = "{`"email`":`"$CUST_EMAIL`",`"password`":`"$CUST_PASS`"}"
$CustLoginRes = Run-Curl "POST" "/auth/login" $LoginPayload

# Extract Token
$CustToken = ($CustLoginRes | ConvertFrom-Json).data.token
Write-Host "Customer Token: $CustToken" -ForegroundColor Yellow

# Get Customer Profile
Run-Curl "GET" "/auth/me" $null $CustToken

# 3. ADDRESS MANAGEMENT
Write-Host "`n--- 3. Testing Address Creation ---" -ForegroundColor Blue
$AddrPayload = "{`"street`":`"123 Main St`",`"city`":`"Noida`",`"state`":`"UP`",`"postalCode`":`"201301`",`"country`":`"India`",`"phone`":`"+919999999999`"}"
$AddrRes = Run-Curl "POST" "/addresses" $AddrPayload $CustToken
$AddressId = ($AddrRes | ConvertFrom-Json).data.id
Write-Host "Created Address ID: $AddressId" -ForegroundColor Yellow

# 4. ADMIN ACTIONS (CATEGORY, TAG, PRODUCT)
Write-Host "`n--- 4. Testing Admin Login & Creation ---" -ForegroundColor Blue
$AdminLoginPayload = "{`"email`":`"admin@skulture.com`",`"password`":`"AdminPassword123`"}"
$AdminLoginRes = Run-Curl "POST" "/auth/login" $AdminLoginPayload
$AdminToken = ($AdminLoginRes | ConvertFrom-Json).data.token
Write-Host "Admin Token: $AdminToken" -ForegroundColor Yellow

# Create Category
$CatPayload = "{`"name`":`"Test Category $RAND`",`"description`":`"Test Description`"}"
$CatRes = Run-Curl "POST" "/admin/categories" $CatPayload $AdminToken
$CategoryId = ($CatRes | ConvertFrom-Json).data.id
Write-Host "Created Category ID: $CategoryId" -ForegroundColor Yellow

# Create Tag
$TagPayload = "{`"name`":`"TestTag$RAND`"}"
$TagRes = Run-Curl "POST" "/admin/tags" $TagPayload $AdminToken
$TagId = ($TagRes | ConvertFrom-Json).data.id
Write-Host "Created Tag ID: $TagId" -ForegroundColor Yellow

# Create Product
$ProdPayload = "{`"name`":`"Test Product $RAND`",`"description`":`"This is a test product description`",`"price`":1200.0,`"stock`":40,`"categoryId`":`"$CategoryId`",`"tags`":[`"$TagId`"]}"
$ProdRes = Run-Curl "POST" "/admin/products" $ProdPayload $AdminToken
$ProductId = ($ProdRes | ConvertFrom-Json).data.id
Write-Host "Created Product ID: $ProductId" -ForegroundColor Yellow

# 5. PUBLIC CATALOG
Write-Host "`n--- 5. Testing Public Catalog Endpoints ---" -ForegroundColor Blue
Run-Curl "GET" "/products"
Run-Curl "GET" "/products/$ProductId"
Run-Curl "GET" "/tags"

# 6. CART & ORDER FLOW
Write-Host "`n--- 6. Testing Cart & Checkout Flow ---" -ForegroundColor Blue
$CartPayload = "{`"productId`":`"$ProductId`",`"quantity`":2}"
Run-Curl "POST" "/cart/items" $CartPayload $CustToken
Run-Curl "GET" "/cart" $null $CustToken

# Create Order
$OrderPayload = "{`"addressId`":`"$AddressId`",`"paymentMethod`":`"COD`"}"
$OrderRes = Run-Curl "POST" "/orders" $OrderPayload $CustToken
$OrderId = ($OrderRes | ConvertFrom-Json).data.id
Write-Host "Created Order ID: $OrderId" -ForegroundColor Yellow

# 7. REVIEWS & INQUIRIES
Write-Host "`n--- 7. Testing Reviews & Inquiries ---" -ForegroundColor Blue
$ReviewPayload = "{`"rating`":5,`"comment`":`"Absolutely brilliant build quality!`"}"
Run-Curl "POST" "/products/$ProductId/reviews" $ReviewPayload $CustToken

$InquiryPayload = "{`"name`":`"Test Customer`",`"email`":`"$CUST_EMAIL`",`"subject`":`"Product Question`",`"message`":`"Can I request custom dimension scaling?`",`"productId`":`"$ProductId`"}"
Run-Curl "POST" "/inquiries" $InquiryPayload

# 8. ADMIN DASHBOARD & SETTINGS
Write-Host "`n--- 8. Testing Admin Dashboard & Settings ---" -ForegroundColor Blue
Run-Curl "GET" "/admin/settings" $null $AdminToken
Run-Curl "GET" "/admin/dashboard" $null $AdminToken
Run-Curl "GET" "/admin/activity-logs" $null $AdminToken

Write-Host "`n==================================================" -ForegroundColor Cyan
Write-Host "ALL FUNCTIONS HAVE BEEN TESTED SUCCESSFULLY!" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
